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
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("service_requests")
    .select("*, category:categories(*), worker:profiles!service_requests_assigned_worker_id_fkey(*)")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
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

  const { requestId, assigned_worker_id, priority, status } = await req.json()
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("service_requests")
    .update({ assigned_worker_id: assigned_worker_id || null, priority, status })
    .eq("id", requestId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
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

  const { requestId } = await req.json()
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("service_requests")
    .delete()
    .eq("id", requestId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
