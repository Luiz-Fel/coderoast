import type { Metadata } from "next"
import Link from "next/link"
import { CodeBlock } from "@/components/ui/code-block"

export const metadata: Metadata = {
  title: "shame_leaderboard — devroast",
  description: "The most roasted code on the internet, ranked by shame.",
}

// ── Static data ───────────────────────────────────────────────────────────────

type LeaderboardEntry = {
  id: string
  rank: number
  score: number
  language: string
  lines: number
  code: string
}

const ENTRIES: LeaderboardEntry[] = [
  {
    id: "1",
    rank: 1,
    score: 1.2,
    language: "javascript",
    lines: 3,
    code: `eval(prompt("enter code"))\ndocument.write(response)\n// trust the user lol`,
  },
  {
    id: "2",
    rank: 2,
    score: 1.8,
    language: "typescript",
    lines: 3,
    code: `if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return !false; }`,
  },
  {
    id: "3",
    rank: 3,
    score: 2.1,
    language: "sql",
    lines: 2,
    code: `SELECT * FROM users WHERE id = \${req.params.id}\n-- TODO: add sanitization sometime`,
  },
  {
    id: "4",
    rank: 4,
    score: 2.3,
    language: "dart",
    lines: 3,
    code: `catch (e) {}\n// it works\n// ig`,
  },
  {
    id: "5",
    rank: 5,
    score: 2.6,
    language: "javascript",
    lines: 3,
    code: `const aNums = [1,2,3]\n  var final2 = aNums[aNums.length-1] = na\nsolutions.data() = calc()`,
  },
]

const STATS = {
  total: 2847,
  avgScore: 4.2,
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

          <div className="flex items-center gap-2 font-mono text-text-tertiary text-xs">
            <span>{STATS.total.toLocaleString("en-US")} submissions</span>
            <span>·</span>
            <span>avg score: {STATS.avgScore.toFixed(1)}/10</span>
          </div>
        </section>

        {/* ── entries ── */}
        <section className="flex flex-col gap-5">
          {ENTRIES.map((entry) => (
            <Link key={entry.id} href={`/roast/${entry.id}`} className="block">
              <div className="border border-border transition-colors hover:border-brand/30">
                {/* meta row */}
                <div className="flex h-12 items-center justify-between border-border border-b px-5">
                  {/* left: rank + score */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[13px] text-text-tertiary">#</span>
                      <span className="font-bold font-mono text-[13px] text-accent-amber">
                        {entry.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-text-tertiary text-xs">score:</span>
                      <ScoreValue score={entry.score} />
                    </div>
                  </div>

                  {/* right: language + lines */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-text-secondary text-xs">{entry.language}</span>
                    <span className="font-mono text-text-tertiary text-xs">
                      {entry.lines} lines
                    </span>
                  </div>
                </div>

                {/* code block */}
                <CodeBlock.Root className="rounded-none border-0">
                  <CodeBlock.Body
                    code={entry.code}
                    lang={entry.language as never}
                    className="max-h-[120px]"
                  />
                </CodeBlock.Root>
              </div>
            </Link>
          ))}
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

// ── Score value helper ─────────────────────────────────────────────────────────

function ScoreValue({ score }: { score: number }) {
  const color =
    score < 4 ? "text-accent-red" : score <= 7 ? "text-accent-amber" : "text-accent-green"

  return <span className={`font-bold font-mono text-[13px] ${color}`}>{score.toFixed(1)}</span>
}
