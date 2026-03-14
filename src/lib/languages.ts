export type SupportedLanguage = {
  id: string
  label: string
  hljsAlias?: string // alias usado pelo highlight.js se diferente do id
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "tsx", label: "TSX / JSX", hljsAlias: "jsx" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go", hljsAlias: "go" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#", hljsAlias: "cs" },
  { id: "php", label: "PHP" },
  { id: "sql", label: "SQL" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "bash", label: "Bash / Shell" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML" },
  { id: "markdown", label: "Markdown", hljsAlias: "md" },
  { id: "plaintext", label: "Plain Text" },
]

// Mapa de hljs language id → shiki language id
const HLJS_TO_SHIKI: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  jsx: "tsx",
  tsx: "tsx",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  cs: "csharp",
  csharp: "csharp",
  php: "php",
  sql: "sql",
  html: "html",
  xml: "html",
  css: "css",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  markdown: "markdown",
}

export function hljsIdToShikiId(hljsId: string): string {
  return HLJS_TO_SHIKI[hljsId.toLowerCase()] ?? "plaintext"
}

export function getLanguageLabel(shikiId: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.id === shikiId)?.label ?? shikiId
}
