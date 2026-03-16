import Link from "next/link"
import { Suspense } from "react"
import { CodeInputForm } from "@/components/ui/code-input-form"
import { LeaderboardPreview, LeaderboardPreviewSkeleton } from "@/components/ui/leaderboard-preview"
import { RoastMetrics, RoastMetricsSkeleton } from "@/components/ui/roast-metrics"

export default async function Home() {
  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-32 px-5 pt-20">
        {/* ── hero ── */}
        <section className="flex w-full flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="flex flex-wrap items-baseline justify-center gap-3 font-bold font-mono text-4xl leading-tight">
              <span className="text-brand">$</span>
              <span className="text-text-primary">paste your code. get roasted.</span>
            </h1>
            <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-sm text-text-secondary">
              {"// drop your code below and we'll rate it — brutally honest or full roast mode"}
            </p>
          </div>
          <CodeInputForm />
        </section>

        {/* ── leaderboard preview ── */}
        <section className="flex w-full flex-col gap-6">
          {/* hero section: title + subtitle + stats */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-brand text-sm">&gt;</span>
                  <h2 className="font-bold font-mono text-text-primary text-xl">
                    shame_leaderboard
                  </h2>
                </div>
                <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-[13px] text-text-secondary">
                  {"// the most roasted code on the internet"}
                </p>
              </div>
              <Link
                href="/leaderboard"
                className="flex shrink-0 items-center gap-1 border border-border px-3 py-1.5 font-mono text-text-secondary text-xs transition-colors hover:border-brand hover:text-brand"
              >
                $ view_all &gt;&gt;
              </Link>
            </div>

            {/* stats row — acima dos cards, fora do border box */}
            <Suspense fallback={<RoastMetricsSkeleton />}>
              <RoastMetrics />
            </Suspense>
          </div>

          {/* cards */}
          <Suspense fallback={<LeaderboardPreviewSkeleton />}>
            <LeaderboardPreview />
          </Suspense>

          {/* bottom link */}
          <p className="text-center font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
            {"showing top 3 · "}
            <Link href="/leaderboard" className="transition-colors hover:text-brand">
              view full leaderboard &gt;&gt;
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
