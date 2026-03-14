import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

// ── Score utils ───────────────────────────────────────────────────────────────

const scoreColor = tv({
  base: "font-bold font-mono text-sm",
  variants: {
    level: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
    },
  },
})

function getScoreLevel(score: number): "critical" | "warning" | "good" {
  if (score < 4) return "critical"
  if (score <= 7) return "warning"
  return "good"
}

// ── Root ──────────────────────────────────────────────────────────────────────

export type LeaderboardRowRootProps = ComponentProps<"div">

function LeaderboardRowRoot({ className, children, ...props }: LeaderboardRowRootProps) {
  return (
    <div
      className={twMerge("flex items-center gap-6 border-b border-border px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Rank ──────────────────────────────────────────────────────────────────────

export type LeaderboardRowRankProps = ComponentProps<"div"> & {
  children: React.ReactNode
  /** If true, renders children as-is instead of wrapping with the `#N` style */
  asLabel?: boolean
}

function LeaderboardRowRank({ className, children, asLabel, ...props }: LeaderboardRowRankProps) {
  return (
    <div className={twMerge("w-10 shrink-0", className)} {...props}>
      {asLabel ? (
        children
      ) : (
        <span className="font-mono text-sm text-text-tertiary">#{children}</span>
      )}
    </div>
  )
}

// ── Score ─────────────────────────────────────────────────────────────────────

export type LeaderboardRowScoreProps = ComponentProps<"div"> &
  ({ value: number; children?: never } | { value?: never; children: React.ReactNode })

function LeaderboardRowScore({ value, className, children, ...props }: LeaderboardRowScoreProps) {
  const level = value !== undefined ? getScoreLevel(value) : "good"
  return (
    <div className={twMerge("w-15 shrink-0", className)} {...props}>
      {children ?? <span className={scoreColor({ level })}>{(value as number).toFixed(1)}</span>}
    </div>
  )
}

// ── Code ──────────────────────────────────────────────────────────────────────

export type LeaderboardRowCodeProps = ComponentProps<"div">

function LeaderboardRowCode({ className, children, ...props }: LeaderboardRowCodeProps) {
  return (
    <div className={twMerge("min-w-0 flex-1", className)} {...props}>
      <span className="block truncate font-mono text-text-secondary text-xs">{children}</span>
    </div>
  )
}

// ── Language ──────────────────────────────────────────────────────────────────

export type LeaderboardRowLanguageProps = ComponentProps<"div">

function LeaderboardRowLanguage({ className, children, ...props }: LeaderboardRowLanguageProps) {
  return (
    <div className={twMerge("w-25 shrink-0 text-right", className)} {...props}>
      <span className="font-mono text-text-tertiary text-xs">{children}</span>
    </div>
  )
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const LeaderboardRow = {
  Root: LeaderboardRowRoot,
  Rank: LeaderboardRowRank,
  Score: LeaderboardRowScore,
  Code: LeaderboardRowCode,
  Language: LeaderboardRowLanguage,
}
