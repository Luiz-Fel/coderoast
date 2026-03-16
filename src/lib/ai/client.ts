import { analyzeCodeWithOpenRouter } from "@/lib/ai/openrouter"
import type { RoastMode } from "@/lib/roast"

type AnalyzeCodeInput = {
  code: string
  mode: RoastMode
}

export async function analyzeCode(input: AnalyzeCodeInput) {
  const provider = process.env.AI_PROVIDER ?? "openrouter"

  if (provider === "openrouter") {
    return analyzeCodeWithOpenRouter(input)
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`)
}
