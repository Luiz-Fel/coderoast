import { z } from "zod"
import type { RoastMode } from "@/lib/roast"

// ── Schema ─────────────────────────────────────────────────────────────────────

const roastIssueSchema = z.object({
  severity: z.enum(["critical", "warning", "good"]),
  title: z.string().trim().min(3).max(256),
  description: z.string().trim().min(8).max(1200),
})

export const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string().trim().min(8).max(320),
  suggestedFix: z.string().trim().max(8000).nullable().optional(),
  language: z.string().trim().min(1).max(64),
  issues: z.array(roastIssueSchema).min(1).max(6),
})

export type RoastAnalysis = z.infer<typeof roastAnalysisSchema>

// ── Prompt builder ─────────────────────────────────────────────────────────────

function modeInstruction(mode: RoastMode): string {
  if (mode === "full_roast") {
    return "Use a sarcastic and witty tone, but never insult identity, protected classes, or use hate/harassment."
  }
  return "Use a direct and professional tone with light humor only."
}

export function buildRoastSystemPrompt(mode: RoastMode): string {
  return [
    "You are CodeRoast, an expert senior software engineer doing concise code review.",
    modeInstruction(mode),
    "Return only valid JSON without markdown.",
    "Keep analysis grounded in the provided code snippet.",
    "Output schema:",
    '{"score": number(0-10), "roastQuote": string, "suggestedFix": string|null, "language": string, "issues": [{"severity":"critical|warning|good","title":string,"description":string}]}',
    "Rules:",
    "- issues must contain between 1 and 6 items.",
    "- suggestedFix should be a compact unified-style diff string when score < 7, otherwise null.",
    "- language must be a likely programming language identifier (e.g. javascript, typescript, python, go, rust, sql, bash).",
    "- roastQuote must be one short sentence.",
  ].join("\n")
}

// ── JSON extraction + normalization ───────────────────────────────────────────

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()

  if (trimmed.startsWith("```")) {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fenceMatch?.[1]) {
      return JSON.parse(fenceMatch[1])
    }
  }

  const firstCurly = trimmed.indexOf("{")
  const lastCurly = trimmed.lastIndexOf("}")

  if (firstCurly >= 0 && lastCurly > firstCurly) {
    return JSON.parse(trimmed.slice(firstCurly, lastCurly + 1))
  }

  return JSON.parse(trimmed)
}

export function normalizeRoastAnalysis(input: unknown): RoastAnalysis {
  return roastAnalysisSchema.parse(input)
}
