import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (user.user_metadata?.role as string) || "citizen"
  if (role !== "admin" && role !== "worker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Use admin client to bypass RLS for reading all workers
  const admin = createAdminClient()
  const { data: workers, error } = await admin
    .from("profiles")
    .select("id, full_name, completed_tasks, sla_violations, average_rating, total_score")
    .eq("role", "worker")
    .order("total_score", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(workers ?? [])
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (user.user_metadata?.role as string) || "citizen"
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()

  // Recalculate scores for all workers
  const { data: workers } = await admin
    .from("profiles")
    .select("id, completed_tasks, sla_violations, average_rating")
    .eq("role", "worker")

  if (!workers) {
    return NextResponse.json({ error: "No workers found" }, { status: 404 })
  }

  let updated = 0
  for (const w of workers) {
    const score =
      (w.completed_tasks || 0) * 10 -
      (w.sla_violations || 0) * 15 +
      (w.average_rating || 0) * 5

    await admin
      .from("profiles")
      .update({ total_score: Math.max(0, score) })
      .eq("id", w.id)

    updated++
  }

  return NextResponse.json({ updated })
}
