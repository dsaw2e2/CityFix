import { generateText, Output } from "ai"
import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

const validationSchema = z.object({
  valid: z.boolean().describe("Whether this is a valid civic issue"),
  score: z.number().min(1).max(10).describe("Severity score 1-10"),
  reason: z.string().describe("Brief 1-2 sentence explanation in the same language as the report"),
  suggested_priority: z.enum(["low", "medium", "high", "urgent"]).describe("Suggested priority level"),
})

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

    const systemPrompt = `You are an AI moderator for CityFix, a 311-style municipal service request platform.

Evaluate whether the citizen's report is a VALID civic issue that warrants dispatching city workers.

REJECT (score 1-3, valid=false):
- Trivially insignificant issues
- Not a civic/municipal matter
- Spam, jokes, gibberish, test submissions
- Too vague to act on

ACCEPT (score 4-10, valid=true):
- Real infrastructure problems (potholes, broken streetlights, water leaks)
- Public safety hazards
- Sanitation issues (overflowing bins, illegal dumping)
- Issues affecting public spaces

Score guide: 1-3 = reject, 4-5 = borderline accept, 6-8 = valid, 9-10 = urgent/critical.
ALWAYS respond in the SAME LANGUAGE as the report.`

    const userContent: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [
      {
        type: "text" as const,
        text: `Report details:\n- Title: ${title}\n- Description: ${description}\n- Category: ${category}\n\nEvaluate this report.`,
      },
    ]

    if (photo_url) {
      userContent.push({
        type: "image" as const,
        image: new URL(photo_url),
      })
      userContent.push({
        type: "text" as const,
        text: "Above is the photo attached to this report. Factor it into your assessment.",
      })
    }

    const { output } = await generateText({
      model: "google/gemini-2.5-flash",
      output: Output.object({ schema: validationSchema }),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    })

    if (!output) {
      return NextResponse.json({
        valid: true,
        score: null,
        reason: "Could not parse AI response - report accepted for manual review",
        suggested_priority: "medium",
      })
    }

    return NextResponse.json({
      valid: output.valid,
      score: output.score,
      reason: output.reason,
      suggested_priority: output.suggested_priority,
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
