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
    .from("profiles")
    .select("*")
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

  const { userId, newRole } = await req.json()
  if (!userId || !newRole) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also update user metadata so the JWT stays in sync
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  })

  return NextResponse.json({ success: true })
}
