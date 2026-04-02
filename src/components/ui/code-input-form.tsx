"use client"

import { useMutation } from "@tanstack/react-query"
import { ChevronDown, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { detectLanguage } from "@/lib/detect-language"
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/languages"
import { MAX_ROAST_CHARS } from "@/lib/roast"
import { highlightCode } from "@/lib/shiki-client"
import { useTRPC } from "@/trpc/client"

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "$ initializing roast engine...",
  "$ parsing your code...",
  "$ consulting the roast oracle...",
  "$ generating insults...",
  "$ calculating shame score...",
]

function LoadingOverlay({ showFallback }: { showFallback: boolean }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cursor, setCursor] = useState(true)

  // Advance through loading steps
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 1100)
    return () => clearInterval(interval)
  }, [])

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as it approaches 90%, never reaches 100% until done
        const remaining = 90 - prev
        return prev + remaining * 0.06
      })
    }, 120)
    return () => clearInterval(interval)
  }, [])

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-start justify-center gap-5 bg-bg/90 px-8 backdrop-blur-sm">
      {/* Steps log */}
      <div className="flex flex-col gap-1.5">
        {LOADING_STEPS.slice(0, stepIndex + 1).map((step, i) => (
          <p
            // biome-ignore lint/suspicious/noArrayIndexKey: static list, order never changes
            key={i}
            className={[
              "font-mono text-xs transition-opacity duration-300",
              i === stepIndex ? "text-text-primary" : "text-text-tertiary",
            ].join(" ")}
          >
            {step}
            {i === stepIndex && <span className={cursor ? "opacity-100" : "opacity-0"}>{"_"}</span>}
          </p>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-px w-full bg-bg-elevated">
          <div
            className="h-px bg-brand transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-text-tertiary tabular-nums">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Fallback message — appears after 6s */}
      {showFallback && (
        <div className="flex flex-col gap-1 border-accent-amber border-l-2 pl-3">
          <p className="font-mono text-accent-amber text-xs">
            {"// this is taking longer than usual..."}
          </p>
          <p className="font-mono text-text-tertiary text-xs">
            {"// hang tight, the AI is still cooking."}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex w-full max-w-195 flex-col gap-6 border border-border bg-[#101010] px-8 py-10">
      {/* window chrome */}
      <div className="flex items-center gap-3">
        <span className="size-2.5 rounded-full bg-accent-red" aria-hidden />
        <span className="size-2.5 rounded-full bg-accent-amber" aria-hidden />
        <span className="size-2.5 rounded-full bg-accent-green" aria-hidden />
      </div>

      {/* error content */}
      <div className="flex flex-col gap-4">
        <p className="font-mono text-accent-red text-sm">{"$ roast_my_code --error"}</p>

        <div className="flex flex-col gap-1.5 border-critical border-l-2 pl-4">
          <p className="font-mono text-text-secondary text-xs">{"// something went wrong"}</p>
          <p className="font-mono text-text-tertiary text-xs">{`// ${message}`}</p>
        </div>

        <div className="flex flex-col gap-1 font-mono text-[11px] text-text-tertiary">
          <p>{"// the roast engine exploded."}</p>
          <p>{"// try submitting again or come back later."}</p>
        </div>
      </div>

      {/* retry button */}
      <Button variant="outline" onClick={onRetry} className="gap-2 self-start">
        <RefreshCw size={12} aria-hidden />
        {"$ try_again"}
      </Button>
    </div>
  )
}

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

// Widths (%) for skeleton line bars — 0 means an empty line gap
const SKELETON_LINE_WIDTHS = [
  34, // function calculateTotal(items) {
  16, // var total = 0;
  43, // for (var i = 0; i < items.length; i++) {
  37, // total = total + items[i].price;
  3, // }
  0, // empty line
  16, // if (total > 100) {
  37, // console.log("discount applied");
  18, // total = total * 0.9;
  3, // }
  0, // empty line
  35, // // TODO: handle tax calculation
  37, // // TODO: handle currency conversion
  16, // return total
  3, // }
]

const MOBILE_SKELETON_LINE_WIDTHS = [
  64, // function calculateTotal(items) {
  32, // var total = 0;
  80, // for (var i = 0; i < items.length; i++) {
  70, // total = total + items[i].price;
  6, // }
  0, // empty line
  40, // if (total > 100) {
  72, // console.log("discount applied");
  48, // total = total * 0.9;
  6, // }
  0, // empty line
  66, // // TODO: handle tax calculation
  74, // // TODO: handle currency conversion
  28, // return total
  6, // }
]

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
  const trpc = useTRPC()
  const [code, setCode] = useState(MOCK_CODE)
  const [roastMode, setRoastMode] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Fatal error replaces the entire form with an error screen
  const [fatalError, setFatalError] = useState<string | null>(null)
  // Fallback message shown after 6s of pending
  const [showFallback, setShowFallback] = useState(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createRoast = useMutation(
    trpc.roasts.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`)
      },
      onError: (error) => {
        const msg = error.message || "failed to roast code. try again."
        // Rate limit errors stay inline; everything else shows the error screen
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          setSubmitError(msg)
        } else {
          setFatalError(msg)
        }
      },
    })
  )

  const { isPending } = createRoast

  // Start/stop the 6-second fallback timer based on pending state
  useEffect(() => {
    if (isPending) {
      setShowFallback(false)
      fallbackTimerRef.current = setTimeout(() => {
        setShowFallback(true)
      }, 6000)
    } else {
      setShowFallback(false)
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [isPending])

  // Language state
  const [detectedLang, setDetectedLang] = useState<string>("javascript")
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const activeLang = selectedLang ?? detectedLang
  const [isOverlayReady, setIsOverlayReady] = useState(false)

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
    setIsOverlayReady(html.length > 0)
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
    renderPlainOverlay(MOCK_CODE)
    applyHighlight(MOCK_CODE, "javascript")
  }, [applyHighlight, renderPlainOverlay])

  // ── Debounced highlight (150 ms) ──────────────────────────────────────────
  useEffect(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      renderPlainOverlay(code)
      applyHighlight(code, activeLangRef.current)
    }, 150)
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [code, applyHighlight, renderPlainOverlay])

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

  const charCount = code.length
  const isOverLimit = charCount > MAX_ROAST_CHARS

  function handleSubmit() {
    if (createRoast.isPending || isOverLimit) return

    const normalizedCode = code.trim()

    if (!normalizedCode) {
      setSubmitError("paste some code before roasting.")
      return
    }

    setSubmitError(null)
    setFatalError(null)
    createRoast.mutate({
      code: normalizedCode,
      mode: roastMode ? "full_roast" : "brutally_honest",
    })
  }

  // Show the error screen when a fatal (non-rate-limit) error occurs
  if (fatalError) {
    return (
      <ErrorScreen
        message={fatalError}
        onRetry={() => {
          setFatalError(null)
          setSubmitError(null)
        }}
      />
    )
  }

  return (
    <div className="flex w-full max-w-195 flex-col gap-4">
      {/* editor shell — relative so the loading overlay can be positioned inside */}
      <div className="relative overflow-hidden border border-border bg-[#101010]">
        {/* loading overlay — shown while the roast mutation is in flight */}
        {isPending && <LoadingOverlay showFallback={showFallback} />}

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

              {/* skeleton overlay — shown while Shiki highlight is loading */}
              {!isOverlayReady && (
                <div aria-hidden className="pointer-events-none absolute inset-0 px-4 py-3">
                  {/* desktop widths — hidden on mobile */}
                  <div className="hidden sm:block">
                    {SKELETON_LINE_WIDTHS.map((width, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, order never changes
                        key={i}
                        className="mb-[7.8px] h-[13px] animate-pulse rounded-sm bg-bg-elevated"
                        style={{ width: width === 0 ? 0 : `${width}%` }}
                      />
                    ))}
                  </div>
                  {/* mobile widths — hidden on desktop */}
                  <div className="block sm:hidden">
                    {MOBILE_SKELETON_LINE_WIDTHS.map((width, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, order never changes
                        key={i}
                        className="mb-[7.8px] h-[13px] animate-pulse rounded-sm bg-bg-elevated"
                        style={{ width: width === 0 ? 0 : `${width}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}

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

        {/* editor footer — char counter */}
        <div className="flex items-center justify-end border-border border-t px-4 py-1.5">
          <span
            className={[
              "font-mono text-[11px] tabular-nums transition-colors",
              isOverLimit ? "text-accent-red" : "text-text-tertiary",
            ].join(" ")}
          >
            {charCount}/{MAX_ROAST_CHARS}
          </span>
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
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isOverLimit || createRoast.isPending || code.trim().length === 0}
        >
          {createRoast.isPending ? "$ roasting..." : "$ roast_my_code"}
        </Button>
      </div>

      {submitError && (
        <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-critical text-xs">
          {submitError}
        </p>
      )}
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
