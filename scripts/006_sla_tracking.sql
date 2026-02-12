-- Add 'overdue' to the request_status enum
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'overdue' AFTER 'in_progress';

-- Add SLA deadline column to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS sla_deadline timestamptz;

-- Add worker performance columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS completed_tasks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_violations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score double precision NOT NULL DEFAULT 0;

-- Create SLA violations table
CREATE TABLE IF NOT EXISTS public.sla_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  delay_hours double precision NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sla_violations ENABLE ROW LEVEL SECURITY;

-- Admins can read all violations
CREATE POLICY "sla_violations_admin_select" ON public.sla_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins can insert violations (from SLA check)
CREATE POLICY "sla_violations_admin_insert" ON public.sla_violations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Workers can see their own violations
CREATE POLICY "sla_violations_worker_select" ON public.sla_violations
  FOR SELECT USING (
    worker_id = auth.uid()
  );

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_sla_violations_request ON public.sla_violations(request_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_worker ON public.sla_violations(worker_id);
CREATE INDEX IF NOT EXISTS idx_requests_sla_deadline ON public.service_requests(sla_deadline);

-- Function to calculate SLA deadline based on category and priority
-- Garbage/Trash -> 12h, Streetlight/Light -> 24h, Road/Pothole/Sidewalk -> 48h, default -> 24h
-- High priority reduces time by 30%
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_name text;
  base_hours integer;
  final_hours double precision;
BEGIN
  -- Get category name
  SELECT name INTO category_name
  FROM public.categories
  WHERE id = NEW.category_id;

  -- Determine base SLA hours by category
  CASE
    WHEN category_name ILIKE '%trash%' OR category_name ILIKE '%garbage%' OR category_name ILIKE '%dumping%' THEN
      base_hours := 12;
    WHEN category_name ILIKE '%streetlight%' OR category_name ILIKE '%light%' THEN
      base_hours := 24;
    WHEN category_name ILIKE '%pothole%' OR category_name ILIKE '%road%' OR category_name ILIKE '%sidewalk%' THEN
      base_hours := 48;
    ELSE
      base_hours := 24;
  END CASE;

  -- High/urgent priority reduces time by 30%
  IF NEW.priority IN ('high', 'urgent') THEN
    final_hours := base_hours * 0.7;
  ELSE
    final_hours := base_hours;
  END IF;

  NEW.sla_deadline := NEW.created_at + (final_hours || ' hours')::interval;

  RETURN NEW;
END;
$$;

-- Trigger: auto-calculate SLA deadline on insert
DROP TRIGGER IF EXISTS set_sla_deadline ON public.service_requests;
CREATE TRIGGER set_sla_deadline
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_sla_deadline();

-- Backfill SLA deadlines for existing requests that don't have one
UPDATE public.service_requests sr
SET sla_deadline = sr.created_at + (
  CASE
    WHEN c.name ILIKE '%trash%' OR c.name ILIKE '%garbage%' OR c.name ILIKE '%dumping%' THEN
      CASE WHEN sr.priority IN ('high', 'urgent') THEN 8.4 ELSE 12 END
    WHEN c.name ILIKE '%streetlight%' OR c.name ILIKE '%light%' THEN
      CASE WHEN sr.priority IN ('high', 'urgent') THEN 16.8 ELSE 24 END
    WHEN c.name ILIKE '%pothole%' OR c.name ILIKE '%road%' OR c.name ILIKE '%sidewalk%' THEN
      CASE WHEN sr.priority IN ('high', 'urgent') THEN 33.6 ELSE 48 END
    ELSE
      CASE WHEN sr.priority IN ('high', 'urgent') THEN 16.8 ELSE 24 END
  END || ' hours')::interval
FROM public.categories c
WHERE c.id = sr.category_id
  AND sr.sla_deadline IS NULL;
