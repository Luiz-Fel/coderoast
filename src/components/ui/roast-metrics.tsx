import { caller } from "@/trpc/server"
import { RoastMetricsNumbers } from "./roast-metrics-numbers"

export async function RoastMetrics() {
  const stats = await caller.roasts.stats()
  return <RoastMetricsNumbers total={stats.total} avgScore={stats.avgScore} />
}

export function RoastMetricsSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
        <span className="inline-block h-3 w-28 animate-pulse rounded-sm bg-bg-elevated" />
      </span>
      <span className="font-mono text-text-tertiary text-xs">·</span>
      <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
        <span className="inline-block h-3 w-24 animate-pulse rounded-sm bg-bg-elevated" />
      </span>
    </div>
  )
}
