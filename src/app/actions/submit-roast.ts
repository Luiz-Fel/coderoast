"use server"

import { redirect } from "next/navigation"
import { db } from "@/db"
import { roastIssues, roasts } from "@/db/schema"

// ── Types ─────────────────────────────────────────────────────────────────────

type RoastMode = "brutally_honest" | "full_roast"
type Verdict = "legendary" | "solid" | "needs_work" | "needs_serious_help"

function scoreToVerdict(score: number): Verdict {
  if (score > 9) return "legendary"
  if (score > 7) return "solid"
  if (score >= 4) return "needs_work"
  return "needs_serious_help"
}

// ── AI call (TODO: replace stub with real AI integration) ─────────────────────

type AiResult = {
  score: number
  roastQuote: string
  suggestedFix: string | null
  language: string
  issues: {
    severity: "critical" | "warning" | "good"
    title: string
    description: string
  }[]
}

async function callAi(_code: string, _mode: RoastMode): Promise<AiResult> {
  // TODO: replace with real AI call (OpenAI / Anthropic)
  // The AI should return: score (0-10), roastQuote, suggestedFix (unified diff),
  // detected language, and a list of issues with severity/title/description.
  throw new Error("AI integration not yet implemented")
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function submitRoast(formData: FormData): Promise<void> {
  const code = formData.get("code")
  const rawMode = formData.get("mode")

  if (typeof code !== "string" || code.trim().length === 0) {
    throw new Error("No code submitted")
  }

  const mode: RoastMode = rawMode === "full_roast" ? "full_roast" : "brutally_honest"

  const lineCount = code.split("\n").length

  const result = await callAi(code, mode)

  const verdict = scoreToVerdict(result.score)

  const [roast] = await db
    .insert(roasts)
    .values({
      code,
      language: result.language,
      lineCount,
      mode,
      score: result.score.toFixed(2),
      verdict,
      roastQuote: result.roastQuote,
      suggestedFix: result.suggestedFix ?? null,
    })
    .returning({ id: roasts.id })

  if (result.issues.length > 0) {
    await db.insert(roastIssues).values(
      result.issues.map((issue, i) => ({
        roastId: roast.id,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        sortOrder: i,
      }))
    )
  }

  redirect(`/roast/${roast.id}`)
}
