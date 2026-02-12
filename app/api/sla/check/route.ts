import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Find overdue requests: past sla_deadline, not resolved/closed/overdue
  const now = new Date().toISOString()
  const { data: overdueRequests, error: fetchErr } = await supabase
    .from("service_requests")
    .select("id, assigned_worker_id, sla_deadline, status")
    .not("status", "in", '("resolved","closed","overdue")')
    .not("sla_deadline", "is", null)
    .lt("sla_deadline", now)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  let marked = 0
  let violations = 0

  for (const req of overdueRequests || []) {
    // Mark as overdue
    await supabase
      .from("service_requests")
      .update({ status: "overdue" })
      .eq("id", req.id)

    // Calculate delay
    const delayMs = Date.now() - new Date(req.sla_deadline!).getTime()
    const delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 10) / 10

    // Record violation
    const { error: violErr } = await supabase.from("sla_violations").insert({
      request_id: req.id,
      worker_id: req.assigned_worker_id,
      delay_hours: delayHours,
    })

    if (!violErr) {
      violations++

      // Increment worker's violation count
      if (req.assigned_worker_id) {
        await supabase.rpc("increment_sla_violations", {
          worker_id: req.assigned_worker_id,
        })
      }
    }

    marked++
  }

  return NextResponse.json({
    checked: (overdueRequests || []).length,
    marked,
    violations,
  })
}
