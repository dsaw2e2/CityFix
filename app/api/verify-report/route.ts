import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const maxDuration = 60

async function callGeminiWithImages(
  systemPrompt: string,
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>
) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set")

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              resolved: { type: "BOOLEAN" },
              score: { type: "INTEGER" },
              comment: { type: "STRING" },
            },
            required: ["resolved", "score", "comment"],
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error("[v0] Gemini verify error:", response.status, errText)
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error("[v0] Gemini verify empty response:", JSON.stringify(data))
    throw new Error("Empty response from Gemini")
  }
  return JSON.parse(text)
}

async function imageUrlToBase64Part(url: string) {
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const mimeType = res.headers.get("content-type") || "image/jpeg"
  return { inline_data: { mime_type: mimeType, data: base64 } }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const requestId = formData.get("request_id") as string
    const beforeUrl = formData.get("before_url") as string | null
    const afterFile = formData.get("after_photo") as File | null

    if (!requestId || !afterFile) {
      return NextResponse.json(
        { error: "Missing request_id or after_photo" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch { /* ignore */ }
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Upload after photo
    const ext = afterFile.name.split(".").pop() || "jpg"
    const filePath = `${user.id}/after_${Date.now()}.${ext}`
    const arrayBuffer = await afterFile.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("request-photos")
      .upload(filePath, arrayBuffer, {
        contentType: afterFile.type || "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl: afterUrl } } = supabase.storage
      .from("request-photos")
      .getPublicUrl(filePath)

    // Build parts for Gemini
    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = []

    if (beforeUrl) {
      parts.push({ text: "Compare the BEFORE and AFTER photos of a civic issue repair. Determine if resolved and rate work quality 1-10." })
      try {
        parts.push(await imageUrlToBase64Part(beforeUrl))
        parts.push({ text: "Above: BEFORE photo." })
      } catch { /* skip */ }
    } else {
      parts.push({ text: "Analyze this AFTER photo of a completed civic maintenance job. Determine if resolved and rate work quality 1-10." })
    }

    try {
      parts.push(await imageUrlToBase64Part(afterUrl))
      parts.push({ text: "Above: AFTER photo." })
    } catch { /* skip */ }

    let verification: { resolved: boolean; score: number; comment: string }

    try {
      const result = await callGeminiWithImages(
        "You are an AI inspector for a municipal service system. Evaluate work completion quality. Respond in the same language as context.",
        parts
      )
      verification = {
        resolved: !!result.resolved,
        score: Number(result.score) || 0,
        comment: result.comment || "",
      }
    } catch (aiErr) {
      console.error("[verify-report] AI error:", aiErr)
      verification = {
        resolved: false,
        score: 0,
        comment: "AI verification temporarily unavailable",
      }
    }

    // Store result
    const { error: dbError } = await supabase
      .from("service_requests")
      .update({ ai_verification: verification })
      .eq("id", requestId)

    if (dbError) console.error("[verify-report] DB error:", dbError)

    return NextResponse.json({ verification, after_url: afterUrl })
  } catch (err) {
    console.error("[verify-report] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
