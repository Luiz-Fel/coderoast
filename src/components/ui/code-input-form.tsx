"use client"

import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
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

// Must match font-size 13px × line-height 1.6 and py-3 (12px) padding
const LINE_HEIGHT_PX = 13 * 1.6 // 20.8
const EDITOR_PADDING_Y = 12

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
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const activeLang = selectedLang ?? detectedLang

  const activeLangRef = useRef(activeLang)
  useEffect(() => {
    activeLangRef.current = activeLang
  }, [activeLang])

  // DOM refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  // The single scroll container that wraps both textarea and overlay
  const scrollWrapperRef = useRef<HTMLDivElement>(null)

  // Debounce timers
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Request ID to discard stale highlight results from rapid typing
  const highlightRequestRef = useRef(0)

  const setOverlayHtml = useCallback((html: string) => {
    const el = overlayRef.current
    if (el) el.innerHTML = html
  }, [])

  const renderPlainOverlay = useCallback(
    (value: string) => {
      setOverlayHtml(`<pre class="shiki"><code>${escapeHtml(value)}</code></pre>`)
    },
    [setOverlayHtml]
  )

  // ── Apply highlight directly to DOM — no setState, no re-render ───────────
  const applyHighlight = useCallback(
    (codeStr: string, lang: string) => {
      const requestId = ++highlightRequestRef.current
      highlightCode(codeStr, lang).then((html) => {
        // Discard if a newer request has already been issued
        if (requestId !== highlightRequestRef.current) return
        setOverlayHtml(html)
      })
    },
    [setOverlayHtml]
  )

  // ── Initial highlight on mount ─────────────────────────────────────────────
  useEffect(() => {
    applyHighlight(MOCK_CODE, "javascript")
  }, [applyHighlight])

  // ── Debounced highlight (150 ms) ──────────────────────────────────────────
  useEffect(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      applyHighlight(code, activeLangRef.current)
    }, 150)
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [code, activeLang, applyHighlight])

  // ── Debounced language detection (500 ms) ─────────────────────────────────
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

  // ── Auto-size textarea height to match content ────────────────────────────
  // The textarea is in-flow (not absolute), so it defines the content height.
  // Setting height to scrollHeight makes it always fully expanded — the outer
  // scroll wrapper handles all scrolling instead of the textarea itself.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    // Reset to auto first so shrinking content reduces the height correctly
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [code])

  // ── Scroll sync: gutter follows the scroll wrapper ────────────────────────
  // The overlay scrolls naturally with the wrapper (it's in the same scroll
  // context via absolute positioning inside the content sizer). Only the
  // gutter, which lives outside the scroll wrapper, needs manual sync.
  const handleScroll = useCallback(() => {
    const wrapper = scrollWrapperRef.current
    const lineNums = lineNumbersRef.current
    if (wrapper && lineNums) {
      lineNums.scrollTop = wrapper.scrollTop
    }
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

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const rawText = e.clipboardData.getData("text")
      if (!rawText) return

      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const pastedText = rawText.replace(/\r\n?/g, "\n")
      const nextCode = `${code.slice(0, start)}${pastedText}${code.slice(end)}`

      // Immediate plain render keeps visual geometry stable while async
      // syntax highlighting for large pasted content is still in flight.
      renderPlainOverlay(nextCode)
      setCode(nextCode)

      requestAnimationFrame(() => {
        const nextCursor = start + pastedText.length
        textarea.selectionStart = nextCursor
        textarea.selectionEnd = nextCursor
      })
    },
    [code, renderPlainOverlay]
  )

  const lineCount = code.split("\n").length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  // Gutter inner height must match the content height exactly so line numbers
  // stay aligned as the user scrolls.
  const gutterHeight = lineCount * LINE_HEIGHT_PX + EDITOR_PADDING_Y * 2

  function handleSubmit() {
    router.push("/roast")
  }

  return (
    <div className="flex w-full max-w-[780px] flex-col gap-4">
      {/* editor shell */}
      <div className="overflow-hidden border border-border bg-[#101010]">
        {/* window chrome header */}
        <div className="flex h-10 shrink-0 items-center gap-3 border-border border-b px-4">
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
        <div className="flex" style={{ minHeight: 200, maxHeight: 520 }}>
          {/* gutter — overflow-hidden, synced via scrollTop from the wrapper */}
          <div
            ref={lineNumbersRef}
            className="shrink-0 overflow-hidden border-border border-r bg-bg-surface"
            aria-hidden
          >
            <div
              className="px-3 text-right"
              style={{
                height: gutterHeight,
                paddingTop: EDITOR_PADDING_Y,
                paddingBottom: EDITOR_PADDING_Y,
              }}
            >
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="font-mono text-[13px] text-text-tertiary"
                  style={{ lineHeight: `${LINE_HEIGHT_PX}px` }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* ── Single scroll container ──────────────────────────────────────
              Both the overlay and the textarea live inside this wrapper.
              The wrapper is the ONLY element that scrolls — textarea is
              always fully expanded (height = scrollHeight) so it never
              has its own scrollbar. The overlay is absolute inset-0 inside
              the content-sizer, so it moves with the wrapper scroll for free.
          ─────────────────────────────────────────────────────────────────── */}
          <div
            ref={scrollWrapperRef}
            onScroll={handleScroll}
            className="code-editor-scroll min-w-0 flex-1 overflow-auto"
          >
            {/* content sizer: relative so the overlay can be absolute inset-0 */}
            <div className="relative" style={{ minHeight: "100%" }}>
              {/* highlight overlay — absolute, fills the content sizer,
                  scrolls naturally with the wrapper, no manual sync needed */}
              <div
                ref={overlayRef}
                aria-hidden
                className="code-editor-overlay pointer-events-none absolute inset-0 px-4 py-3"
              />

              {/* textarea: in-flow, height set to scrollHeight via useLayoutEffect
                  wrap="off" keeps lines intact so selection aligns with overlay */}
              <textarea
                ref={textareaRef}
                value={code}
                wrap="off"
                onChange={(e) => setCode(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                data-enable-grammarly="false"
                className={[
                  "relative block w-full resize-none bg-transparent px-4 py-3",
                  "font-mono text-[13px] leading-[1.6]",
                  "text-transparent caret-text-primary",
                  "focus-visible:shadow-none focus-visible:outline-none",
                  // No overflow-auto here — the wrapper handles all scrolling
                  "overflow-hidden",
                ].join(" ")}
                style={{ WebkitTextFillColor: "transparent" }}
                placeholder="// paste your code here..."
                aria-label="Code input"
              />
            </div>
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
