import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, category_id, priority, address, latitude, longitude, photo_url } = body

  if (!title || !category_id) {
    return NextResponse.json({ error: "Title and category are required" }, { status: 400 })
  }

  // Use the same authenticated supabase client - RLS policy is auth.uid() = citizen_id
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      title,
      description: description || null,
      category_id,
      priority: priority || "medium",
      citizen_id: user.id,
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      photo_url: photo_url || null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[v0] Submit error:", error.message, error.details, error.hint)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
