"use client"

import Link from "next/link"
import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

// ── score color ───────────────────────────────────────────────────────────────

const scoreText = tv({
  base: "font-bold font-mono",
  variants: {
    level: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
    },
  },
})

function getLevel(score: number): "critical" | "warning" | "good" {
  if (score < 4) return "critical"
  if (score <= 7) return "warning"
  return "good"
}

// ── ChevronDown ───────────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      role="presentation"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// ── LeaderboardCard ───────────────────────────────────────────────────────────

export type LeaderboardCardProps = {
  id: string
  rank: number
  score: number
  language: string | null
  lineCount: number
  codeBlock: React.ReactNode
}

export function LeaderboardCard({
  id,
  rank,
  score,
  language,
  lineCount,
  codeBlock,
}: LeaderboardCardProps) {
  const [expanded, setExpanded] = useState(false)
  const level = getLevel(score)

  return (
    <div className="flex flex-col border border-border">
      {/* ── meta row ── */}
      <div className="flex h-12 items-center justify-between border-border border-b px-5">
        {/* left: rank + score */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-text-tertiary text-xs">rank</span>
            <span className="font-mono text-sm text-text-secondary">#{rank}</span>
          </div>
          <span className="text-text-tertiary">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-text-tertiary text-xs">score</span>
            <span className={twMerge(scoreText({ level }), "text-sm")}>
              {score.toFixed(1)}
              <span className="font-normal text-text-tertiary">/10</span>
            </span>
          </div>
        </div>

        {/* right: lang + lines */}
        <div className="flex items-center gap-3">
          {language && <span className="font-mono text-text-secondary text-xs">{language}</span>}
          <span className="font-mono text-text-tertiary text-xs">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
      </div>

      {/* ── code block — always partially visible ── */}
      <div className="relative overflow-hidden">
        <div
          className={twMerge(
            "transition-[max-height] duration-300 ease-in-out",
            expanded ? "max-h-[9999px]" : "max-h-[130px]"
          )}
        >
          {codeBlock}
        </div>

        {/* fade mask — hidden when expanded */}
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#101010] to-transparent" />
        )}
      </div>

      {/* ── action bar ── */}
      <div className="flex items-center justify-end gap-4 border-border border-t bg-bg-surface px-4 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 font-mono text-[11px] text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ChevronDown
            className={twMerge("transition-transform duration-200", expanded && "rotate-180")}
          />
          {expanded ? "show less" : "show more"}
        </button>

        <Link
          href={`/roast/${id}`}
          className="font-mono text-[11px] text-text-tertiary transition-colors hover:text-brand"
        >
          {"view roast >>"}
        </Link>
      </div>
    </div>
  )
}
