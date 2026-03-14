import Link from "next/link"
import { getLeaderboard, getLeaderboardStats } from "@/app/actions/get-leaderboard"
import { CodeInputForm } from "@/components/ui/code-input-form"
import { LeaderboardRow } from "@/components/ui/leaderboard-row"

export default async function Home() {
  const [rows, stats] = await Promise.all([getLeaderboard(3), getLeaderboardStats()])

  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-32 px-5 pt-20">
        {/* ── hero ── */}
        <section className="flex w-full flex-col items-center gap-8">
          {/* title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="flex flex-wrap items-baseline justify-center gap-3 font-bold font-mono text-4xl leading-tight">
              <span className="text-brand">$</span>
              <span className="text-text-primary">paste your code. get roasted.</span>
            </h1>
            <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-sm text-text-secondary">
              {"// drop your code below and we'll rate it — brutally honest or full roast mode"}
            </p>
          </div>

          {/* code input */}
          <CodeInputForm />

          {/* footer hint */}
          <div className="flex items-center gap-6">
            <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
              {stats.total.toLocaleString()} codes roasted
            </span>
            <span className="font-mono text-text-tertiary text-xs">·</span>
            <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
              avg score: {stats.avgScore.toFixed(1)}/10
            </span>
          </div>
        </section>

        {/* ── leaderboard preview ── */}
        <section className="flex w-full flex-col gap-6">
          {/* section header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-brand text-sm">#</span>
                <h2 className="font-medium font-mono text-base text-text-primary">
                  shame_leaderboard
                </h2>
              </div>
              <Link
                href="/leaderboard"
                className="flex items-center gap-1 border border-border px-3 py-1.5 font-mono text-text-secondary text-xs transition-colors hover:border-brand hover:text-brand"
              >
                $ view_all &gt;&gt;
              </Link>
            </div>
            <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-[13px] text-text-tertiary">
              {"// the worst code on the internet, ranked by shame"}
            </p>
          </div>

          {/* table */}
          <div className="flex flex-col border border-border">
            {/* table header */}
            <LeaderboardRow.Root className="border-b bg-bg-surface py-2.5">
              <LeaderboardRow.Rank asLabel>
                <span className="font-mono text-text-tertiary text-xs">rank</span>
              </LeaderboardRow.Rank>
              <LeaderboardRow.Score>
                <span className="font-mono text-text-tertiary text-xs">score</span>
              </LeaderboardRow.Score>
              <LeaderboardRow.Code>
                <span className="font-mono text-text-tertiary text-xs">code</span>
              </LeaderboardRow.Code>
              <LeaderboardRow.Language>
                <span className="font-mono text-text-tertiary text-xs">lang</span>
              </LeaderboardRow.Language>
            </LeaderboardRow.Root>

            {/* rows */}
            {rows.map((row) => (
              <Link key={row.id} href={`/roast/${row.id}`} className="block">
                <LeaderboardRow.Root className="transition-colors hover:bg-bg-surface">
                  <LeaderboardRow.Rank>{row.rank}</LeaderboardRow.Rank>
                  <LeaderboardRow.Score value={row.score} />
                  <LeaderboardRow.Code>{row.codePreview}</LeaderboardRow.Code>
                  <LeaderboardRow.Language>{row.language ?? "—"}</LeaderboardRow.Language>
                </LeaderboardRow.Root>
              </Link>
            ))}
          </div>

          {/* fade hint */}
          <p className="text-center font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
            showing top 3 of {stats.total.toLocaleString()} · view full leaderboard &gt;&gt;
          </p>
        </section>
      </div>
    </main>
  )
}
