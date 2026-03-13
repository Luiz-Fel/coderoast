import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

const scoreColor = tv({
  base: "font-mono text-sm font-bold",
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

export type LeaderboardRowProps = ComponentProps<"div"> & {
  rank: number
  score: number
  codePreview: string
  language: string
}

export function LeaderboardRow({
  rank,
  score,
  codePreview,
  language,
  className,
  ...props
}: LeaderboardRowProps) {
  const level = getScoreLevel(score)

  return (
    <div
      className={twMerge("flex items-center gap-6 border-b border-border px-5 py-4", className)}
      {...props}
    >
      {/* rank */}
      <div className="w-10 shrink-0">
        <span className="font-mono text-sm text-text-tertiary">#{rank}</span>
      </div>

      {/* score */}
      <div className="w-15 shrink-0">
        <span className={scoreColor({ level })}>{score.toFixed(1)}</span>
      </div>

      {/* code preview */}
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-xs text-text-secondary">{codePreview}</span>
      </div>

      {/* language */}
      <div className="w-25 shrink-0 text-right">
        <span className="font-mono text-xs text-text-tertiary">{language}</span>
      </div>
    </div>
  )
}
