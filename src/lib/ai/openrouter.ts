import OpenAI from "openai"
import { z } from "zod"
import { MAX_ROAST_CHARS, type RoastMode } from "@/lib/roast"

const roastIssueSchema = z.object({
  severity: z.enum(["critical", "warning", "good"]),
  title: z.string().trim().min(3).max(256),
  description: z.string().trim().min(8).max(1200),
})

const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string().trim().min(8).max(320),
  suggestedFix: z.string().trim().max(8000).nullable().optional(),
  language: z.string().trim().min(1).max(64),
  issues: z.array(roastIssueSchema).min(1).max(6),
})

export type RoastAnalysis = z.infer<typeof roastAnalysisSchema>

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_SITE_NAME ?? "coderoast",
    },
  })
}

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

export async function analyzeCodeWithOpenRouter({
  code,
  mode,
}: {
  code: string
  mode: RoastMode
}): Promise<RoastAnalysis> {
  const snippet = code.trim()

  if (!snippet) {
    throw new Error("No code submitted")
  }

  if (snippet.length > MAX_ROAST_CHARS) {
    throw new Error(`Code exceeds ${MAX_ROAST_CHARS} characters`)
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"
  const client = getOpenRouterClient()
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: buildRoastSystemPrompt(mode),
      },
      {
        role: "user",
        content: `Analyze this code:\n\n${snippet}`,
      },
    ],
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error("OpenRouter returned an empty response")
  }

  const parsed = extractJsonObject(content)
  return normalizeRoastAnalysis(parsed)
}
