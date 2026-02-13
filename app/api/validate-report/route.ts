import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

async function callGemini(systemPrompt: string, userText: string, imageUrl?: string) {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = []

  parts.push({ text: userText })

  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl)
      const buffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const mimeType = imgRes.headers.get("content-type") || "image/jpeg"
      parts.push({ inline_data: { mime_type: mimeType, data: base64 } })
    } catch {
      // skip image if fetch fails
    }
  }

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
              valid: { type: "BOOLEAN" },
              score: { type: "INTEGER" },
              reason: { type: "STRING" },
              suggested_priority: { type: "STRING", enum: ["low", "medium", "high", "urgent"] },
            },
            required: ["valid", "score", "reason", "suggested_priority"],
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error("[v0] Gemini validate error:", response.status, errText)
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty response from Gemini")
  return JSON.parse(text)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, category, photo_url } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an AI moderator for CityFix, a municipal service request platform.

Evaluate whether this report is a VALID civic issue.

REJECT (score 1-3, valid=false): insignificant, not civic, spam, jokes, too vague.
ACCEPT (score 4-10, valid=true): real infrastructure problems, safety hazards, sanitation issues, public space issues.

Score: 1-3=reject, 4-5=borderline, 6-8=valid, 9-10=urgent.
ALWAYS respond in the SAME LANGUAGE as the report.`

    const userText = `Report:\n- Title: ${title}\n- Description: ${description}\n- Category: ${category}\n\nEvaluate this report.`

    const result = await callGemini(systemPrompt, userText, photo_url || undefined)

    return NextResponse.json({
      valid: !!result.valid,
      score: Number(result.score) || null,
      reason: result.reason || "",
      suggested_priority: result.suggested_priority || "medium",
    })
  } catch (err) {
    console.error("[validate-report] Error:", err)
    return NextResponse.json({
      valid: true,
      score: null,
      reason: "Validation service temporarily unavailable - report accepted for manual review",
      suggested_priority: "medium",
    })
  }
}
