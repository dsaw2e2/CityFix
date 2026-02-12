import { generateText, Output } from "ai"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const maxDuration = 60

const verificationSchema = z.object({
  resolved: z.boolean().describe("Whether the issue appears to be resolved"),
  score: z.number().min(1).max(10).describe("Quality of work score 1-10"),
  comment: z.string().describe("Brief comment about what you see, in the same language as the request context"),
})

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
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // ignore
              }
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Upload the "after" photo to Supabase storage
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
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl: afterUrl },
    } = supabase.storage.from("request-photos").getPublicUrl(filePath)

    // Build message content with images
    const userContent: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = []

    const promptText = beforeUrl
      ? "Compare the BEFORE photo and AFTER photo of a civic issue repair (pothole, trash, graffiti, etc.). Determine if the issue is resolved and rate the quality of work."
      : "Analyze this AFTER photo of a completed civic maintenance job. Determine if the issue appears resolved and rate the quality of work."

    userContent.push({ type: "text", text: promptText })

    if (beforeUrl) {
      userContent.push({ type: "image", image: new URL(beforeUrl) })
      userContent.push({ type: "text", text: "Above is the BEFORE photo." })
    }

    userContent.push({ type: "image", image: new URL(afterUrl) })
    userContent.push({ type: "text", text: "Above is the AFTER photo." })

    let verification: { resolved: boolean; score: number; comment: string }

    try {
      const { output } = await generateText({
        model: "google/gemini-2.5-flash",
        output: Output.object({ schema: verificationSchema }),
        system: "You are an AI inspector for a municipal service request system. Evaluate work completion quality.",
        messages: [{ role: "user", content: userContent }],
      })

      verification = output ?? {
        resolved: false,
        score: 0,
        comment: "Could not parse AI response",
      }
    } catch (aiErr) {
      console.error("[verify-report] AI error:", aiErr)
      verification = {
        resolved: false,
        score: 0,
        comment: "AI verification temporarily unavailable",
      }
    }

    // Store verification result on the service request
    const { error: dbError } = await supabase
      .from("service_requests")
      .update({ ai_verification: verification })
      .eq("id", requestId)

    if (dbError) {
      console.error("[verify-report] DB update error:", dbError)
    }

    return NextResponse.json({
      verification,
      after_url: afterUrl,
    })
  } catch (err) {
    console.error("[verify-report] Error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Server error: ${err.message}`
            : "Internal server error",
      },
      { status: 500 }
    )
  }
}
