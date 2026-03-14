import { hljsIdToShikiId, SUPPORTED_LANGUAGES } from "./languages"

// hljs aliases for the languages we support — restricts highlightAuto to our
// subset so it doesn't compete against ~190 grammars and pick absurd results
// (e.g. plain JS being detected as "stata" or "arcade")
const HLJS_SUBSET = SUPPORTED_LANGUAGES.flatMap((l) =>
  l.hljsAlias ? [l.id, l.hljsAlias] : [l.id]
).filter((id) => id !== "plaintext")

/**
 * Detects the programming language of a code snippet using highlight.js.
 * Returns a Shiki-compatible language ID.
 * Falls back to "plaintext" if detection is inconclusive.
 */
export async function detectLanguage(code: string): Promise<string> {
  if (!code.trim()) return "plaintext"

  // Dynamically import highlight.js to avoid SSR issues and keep
  // the initial bundle lean (this chunk is only loaded client-side).
  const hljs = (await import("highlight.js")).default

  // Pass the restricted language subset so highlightAuto doesn't
  // misidentify JS/TS as obscure languages (e.g. "stata", "arcade")
  const result = hljs.highlightAuto(code, HLJS_SUBSET)

  if (result.language) {
    return hljsIdToShikiId(result.language)
  }

  return "plaintext"
}
