import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (user.user_metadata?.role as string) || "citizen"
  if (role !== "worker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()
  const url = new URL(req.url)
  const type = url.searchParams.get("type") || "my"

  if (type === "available") {
    // Unassigned submitted tasks
    const { data, error } = await admin
      .from("service_requests")
      .select("*, category:categories(*)")
      .is("assigned_worker_id", null)
      .eq("status", "submitted")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } else {
    // My assigned tasks
    const { data, error } = await admin
      .from("service_requests")
      .select("*, category:categories(*)")
      .eq("assigned_worker_id", user.id)
      .in("status", ["assigned", "in_progress"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }
}

// Claim a task or update status
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const role = (user.user_metadata?.role as string) || "citizen"
  if (role !== "worker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { requestId, action, status } = await req.json()
  const admin = createAdminClient()

  if (action === "claim") {
    // Claim: assign self only if currently unassigned
    const { data: existing } = await admin
      .from("service_requests")
      .select("assigned_worker_id")
      .eq("id", requestId)
      .single()

    if (existing?.assigned_worker_id) {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 })
    }

    const { error } = await admin
      .from("service_requests")
      .update({ assigned_worker_id: user.id, status: "assigned" })
      .eq("id", requestId)
      .is("assigned_worker_id", null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "update_status") {
    const { error } = await admin
      .from("service_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("assigned_worker_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
