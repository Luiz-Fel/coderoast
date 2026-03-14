import { createHighlighter, type Highlighter } from "shiki"
import { SUPPORTED_LANGUAGES } from "./languages"

let highlighterPromise: Promise<Highlighter> | null = null

/**
 * Returns a shared Shiki highlighter instance (client-side singleton).
 * Lazily loads grammars on demand via `loadLanguageIfNeeded`.
 */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["vesper"],
      langs: [],
    })
  }
  return highlighterPromise
}

/**
 * Highlights a code string using Shiki with the "vesper" theme.
 * Lazy-loads the grammar for the given language if not yet loaded.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter()

  const loadedLangs = highlighter.getLoadedLanguages()

  if (lang !== "plaintext" && !loadedLangs.includes(lang as never)) {
    // Validate that shiki knows this lang before loading
    const supported = SUPPORTED_LANGUAGES.find((l) => l.id === lang)
    if (supported) {
      try {
        await highlighter.loadLanguage(lang as never)
      } catch {
        // If grammar fails to load, fall back to plaintext
        return highlightCode(code, "plaintext")
      }
    } else {
      return highlightCode(code, "plaintext")
    }
  }

  if (lang === "plaintext") {
    // Escape HTML manually — no shiki grammar needed
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
  }

  return highlighter.codeToHtml(code, { lang, theme: "vesper" })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
