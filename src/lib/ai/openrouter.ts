import OpenAI from "openai"
import { MAX_ROAST_CHARS, type RoastMode } from "@/lib/roast"
import {
  buildRoastSystemPrompt,
  extractJsonObject,
  normalizeRoastAnalysis,
  type RoastAnalysis,
} from "./shared"

export type { RoastAnalysis }
export { buildRoastSystemPrompt, extractJsonObject, normalizeRoastAnalysis }

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
