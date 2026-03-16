import { caller } from "@/trpc/server"
import { CodeBlock } from "./code-block"
import { LeaderboardCard } from "./leaderboard-card"

// ─── LeaderboardPreview ───────────────────────────────────────────────────────

export async function LeaderboardPreview() {
  const rows = await caller.roasts.leaderboard({ limit: 3 })

  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => (
        <LeaderboardCard
          key={row.id}
          id={row.id}
          rank={row.rank}
          score={row.score}
          language={row.language}
          lineCount={row.lineCount}
          codeBlock={
            <CodeBlock.Body code={row.code} lang={(row.language ?? "plaintext") as never} />
          }
        />
      ))}
    </div>
  )
}

// ─── LeaderboardPreviewSkeleton ───────────────────────────────────────────────

const SKELETON_LINE_COUNTS = [8, 5, 12]

export function LeaderboardPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {SKELETON_LINE_COUNTS.map((lines, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, order never changes
          key={i}
          className="flex flex-col border border-border"
        >
          {/* meta row */}
          <div className="flex h-12 items-center justify-between border-border border-b px-5">
            <div className="flex items-center gap-4">
              <span className="inline-block h-[12px] w-20 animate-pulse rounded-sm bg-bg-elevated" />
              <span className="inline-block h-[12px] w-16 animate-pulse rounded-sm bg-bg-elevated" />
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-[12px] w-14 animate-pulse rounded-sm bg-bg-elevated" />
              <span className="inline-block h-[12px] w-10 animate-pulse rounded-sm bg-bg-elevated" />
            </div>
          </div>

          {/* code lines */}
          <div className="flex flex-col gap-1.5 p-3">
            {Array.from({ length: lines }, (_, j) => j + 1).map((n) => (
              <span
                key={n}
                className="inline-block h-[13px] animate-pulse rounded-sm bg-bg-elevated"
                style={{ width: `${45 + ((n * 37) % 45)}%` }}
              />
            ))}
          </div>

          {/* action bar */}
          <div className="flex items-center justify-end gap-4 border-border border-t bg-bg-surface px-4 py-2">
            <span className="inline-block h-[11px] w-16 animate-pulse rounded-sm bg-bg-elevated" />
            <span className="inline-block h-[11px] w-14 animate-pulse rounded-sm bg-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  )
}
