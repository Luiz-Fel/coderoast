"use client"

import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { detectLanguage } from "@/lib/detect-language"
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/languages"
import { highlightCode } from "@/lib/shiki-client"

const MOCK_CODE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }
  // TODO: handle tax calculation
  // TODO: handle currency conversion
  
  return total
}`

// ─── Language Selector ────────────────────────────────────────────────────────

type LanguageSelectorProps = {
  activeLang: string
  isAuto: boolean
  onSelect: (lang: string | null) => void
}

function LanguageSelector({ activeLang, isAuto, onSelect }: LanguageSelectorProps) {
  return (
    <div className="relative flex items-center">
      <select
        value={isAuto ? "__auto__" : activeLang}
        onChange={(e) => {
          const val = e.target.value
          onSelect(val === "__auto__" ? null : val)
        }}
        className="cursor-pointer appearance-none bg-transparent py-1 pr-4 pl-0 font-mono text-[11px] text-text-tertiary outline-none hover:text-text-secondary focus:text-text-secondary"
        aria-label="Select language"
      >
        <option value="__auto__">{getLanguageLabel(activeLang)} (auto)</option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={10}
        className="pointer-events-none absolute right-0 text-text-tertiary"
        aria-hidden
      />
    </div>
  )
}

// ─── CodeInputForm ────────────────────────────────────────────────────────────

export function CodeInputForm() {
  const router = useRouter()
  const [code, setCode] = useState(MOCK_CODE)
  const [roastMode, setRoastMode] = useState(false)

  // Language state
  const [detectedLang, setDetectedLang] = useState<string>("javascript")
  const [selectedLang, setSelectedLang] = useState<string | null>(null) // null = auto
  const activeLang = selectedLang ?? detectedLang

  // Keep activeLang in a ref so highlight/detect callbacks always see latest value
  const activeLangRef = useRef(activeLang)
  useEffect(() => {
    activeLangRef.current = activeLang
  }, [activeLang])

  // Refs for DOM-direct overlay update (avoids React re-render on every highlight)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Debounce timers
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Apply highlight directly to DOM — no setState, no re-render ───────────
  const applyHighlight = useCallback((codeStr: string, lang: string) => {
    highlightCode(codeStr, lang).then((html) => {
      const el = overlayRef.current
      if (el) el.innerHTML = html
    })
  }, [])

  // ── Initial highlight on mount ─────────────────────────────────────────────
  useEffect(() => {
    applyHighlight(MOCK_CODE, "javascript")
  }, [applyHighlight])

  // ── Debounced highlight (150 ms) triggered by code or language change ──────
  useEffect(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      applyHighlight(code, activeLangRef.current)
    }, 150)
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [code, activeLang, applyHighlight])

  // ── Debounced language detection (500 ms) — skipped when manually set ─────
  useEffect(() => {
    if (selectedLang !== null) return
    if (detectTimerRef.current) clearTimeout(detectTimerRef.current)
    detectTimerRef.current = setTimeout(() => {
      detectLanguage(code).then(setDetectedLang)
    }, 500)
    return () => {
      if (detectTimerRef.current) clearTimeout(detectTimerRef.current)
    }
  }, [code, selectedLang])

  // ── Scroll sync ────────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current
    const overlay = overlayRef.current
    if (!textarea || !overlay) return
    overlay.scrollTop = textarea.scrollTop
    overlay.scrollLeft = textarea.scrollLeft
  }, [])

  // ── Tab key handling ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newCode = `${code.slice(0, start)}  ${code.slice(end)}`
        setCode(newCode)
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    },
    [code]
  )

  const lineCount = code.split("\n").length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  function handleSubmit() {
    router.push("/roast")
  }

  return (
    <div className="flex w-full max-w-[780px] flex-col gap-4">
      {/* editor */}
      <div className="overflow-hidden border border-border bg-[#101010]">
        {/* window header */}
        <div className="flex h-10 items-center gap-3 border-border border-b px-4">
          <span className="size-2.5 rounded-full bg-accent-red" aria-hidden />
          <span className="size-2.5 rounded-full bg-accent-amber" aria-hidden />
          <span className="size-2.5 rounded-full bg-accent-green" aria-hidden />
          <span className="flex-1" />
          <LanguageSelector
            activeLang={activeLang}
            isAuto={selectedLang === null}
            onSelect={setSelectedLang}
          />
        </div>

        {/* editor body */}
        <div className="flex" style={{ height: 320 }}>
          {/* line numbers */}
          <div
            className="flex shrink-0 flex-col gap-0 border-border border-r bg-bg-surface px-3 py-3 text-right"
            aria-hidden
          >
            {lineNumbers.map((n) => (
              <span
                key={n}
                className="block font-mono text-[13px] text-text-tertiary leading-[1.6]"
              >
                {n}
              </span>
            ))}
          </div>

          {/* editor area: textarea + highlight overlay stacked */}
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {/* syntax highlight overlay — updated directly via ref, no re-render */}
            <div
              ref={overlayRef}
              aria-hidden
              className="code-editor-overlay pointer-events-none absolute inset-0 overflow-hidden px-4 py-3"
            />

            {/* invisible textarea on top — sole scroll container */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              data-enable-grammarly="false"
              className={[
                "absolute inset-0 m-0 block h-full w-full resize-none bg-transparent px-4 py-3",
                "font-mono text-[13px] leading-[1.6]",
                "text-transparent caret-text-primary",
                "outline-none placeholder:text-text-tertiary",
                "overflow-auto",
              ].join(" ")}
              style={{ WebkitTextFillColor: "transparent" }}
              placeholder="// paste your code here..."
              aria-label="Code input"
            />
          </div>
        </div>
      </div>

      {/* actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle checked={roastMode} onCheckedChange={setRoastMode} label="roast mode" />
          <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
            {"// maximum sarcasm enabled"}
          </span>
        </div>

        <Button variant="primary" onClick={handleSubmit}>
          $ roast_my_code
        </Button>
      </div>
    </div>
  )
}
