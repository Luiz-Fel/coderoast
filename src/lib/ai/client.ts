import { analyzeCodeWithGemini, isGeminiQuotaError } from "@/lib/ai/gemini"
import { analyzeCodeWithOpenRouter } from "@/lib/ai/openrouter"
import type { RoastMode } from "@/lib/roast"

type AnalyzeCodeInput = {
  code: string
  mode: RoastMode
}

export async function analyzeCode(input: AnalyzeCodeInput) {
  try {
    return await analyzeCodeWithGemini(input)
  } catch (err) {
    if (isGeminiQuotaError(err)) {
      console.warn("[ai/client] Gemini quota exceeded — falling back to OpenRouter")
      return await analyzeCodeWithOpenRouter(input)
    }
    throw err
  }
}
