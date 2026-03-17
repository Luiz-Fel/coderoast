import { GoogleGenAI } from "@google/genai"
import { MAX_ROAST_CHARS, type RoastMode } from "@/lib/roast"
import {
  buildRoastSystemPrompt,
  extractJsonObject,
  normalizeRoastAnalysis,
  type RoastAnalysis,
} from "./shared"

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  return new GoogleGenAI({ apiKey })
}

export function isGeminiQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // Google GenAI SDK throws with status 429 or message containing RESOURCE_EXHAUSTED
  const msg = err.message.toUpperCase()
  return (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("429") ||
    msg.includes("QUOTA") ||
    ("status" in err && (err as { status: number }).status === 429)
  )
}

export async function analyzeCodeWithGemini({
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

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
  const client = getGeminiClient()

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: `Analyze this code:\n\n${snippet}` }] }],
    config: {
      temperature: 0.4,
      systemInstruction: buildRoastSystemPrompt(mode),
    },
  })

  const content = response.text

  if (!content) {
    throw new Error("Gemini returned an empty response")
  }

  const parsed = extractJsonObject(content)
  return normalizeRoastAnalysis(parsed)
}
