"use client"

import NumberFlow from "@number-flow/react"
import { useEffect, useState } from "react"

interface RoastMetricsNumbersProps {
  total: number
  avgScore: number
}

export function RoastMetricsNumbers({ total, avgScore }: RoastMetricsNumbersProps) {
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [animatedAvgScore, setAnimatedAvgScore] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimatedTotal(total)
      setAnimatedAvgScore(avgScore)
    })

    return () => cancelAnimationFrame(id)
  }, [total, avgScore])

  return (
    <div className="flex items-center gap-6">
      <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs tabular-nums">
        <NumberFlow value={animatedTotal} format={{ useGrouping: true }} /> codes roasted
      </span>
      <span className="font-mono text-text-tertiary text-xs">·</span>
      <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs tabular-nums">
        {"avg score: "}
        <NumberFlow
          value={animatedAvgScore}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
        {"/10"}
      </span>
    </div>
  )
}
