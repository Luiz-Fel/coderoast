import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LeaderboardFull, LeaderboardFullSkeleton } from "@/components/ui/leaderboard-full"
import { RoastMetrics, RoastMetricsSkeleton } from "@/components/ui/roast-metrics"

export const metadata: Metadata = {
  title: "shame_leaderboard — coderoast",
  description: "The most roasted code on the internet, ranked by shame.",
}

export default async function LeaderboardPage() {
  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col gap-10 px-5 pt-10">
        {/* ── hero ── */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="flex items-baseline gap-3 font-bold font-mono text-3xl">
              <span className="text-brand">&gt;</span>
              <span className="text-text-primary">shame_leaderboard</span>
            </h1>
            <p className="font-mono-alt text-sm text-text-secondary">
              {"// the most roasted code on the internet"}
            </p>
          </div>

          <Suspense fallback={<RoastMetricsSkeleton />}>
            <RoastMetrics />
          </Suspense>
        </section>

        {/* ── entries ── */}
        <section className="flex flex-col gap-5">
          <Suspense fallback={<LeaderboardFullSkeleton />}>
            <LeaderboardFull />
          </Suspense>
        </section>

        {/* ── back to home ── */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="border border-border px-4 py-2 font-mono text-text-secondary text-xs transition-colors hover:border-brand hover:text-brand"
          >
            &lt; back to roast
          </Link>
        </div>
      </div>
    </main>
  )
}
