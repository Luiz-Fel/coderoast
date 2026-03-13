import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

export type ScoreRingProps = ComponentProps<"figure"> & {
  score: number
  maxScore?: number
  size?: number
}

export function ScoreRing({
  score,
  maxScore = 10,
  size = 180,
  className,
  ...props
}: ScoreRingProps) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(score, maxScore))
  const progress = clampedScore / maxScore
  // Arc starts at the top (−90°) — offset moves the drawn portion
  const dashOffset = circumference * (1 - progress)

  const gradientId = `score-ring-gradient-${size}`

  return (
    <figure
      className={twMerge("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
        role="presentation"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
        />

        {/* arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      {/* center text */}
      <div className="relative flex flex-col items-center leading-none">
        <span className="font-mono text-5xl font-bold leading-none text-text-primary">
          {clampedScore % 1 === 0 ? clampedScore : clampedScore.toFixed(1)}
        </span>
        <span className="font-mono text-base text-text-tertiary">/10</span>
      </div>
    </figure>
  )
}
