import Link from "next/link"
import { notFound } from "next/navigation"
import type { BundledLanguage } from "shiki"
import { getRoast } from "@/app/actions/get-roast"
import { AnalysisCard } from "@/components/ui/analysis-card"
import { CodeBlock } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { ScoreRing } from "@/components/ui/score-ring"

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERDICT_LABELS: Record<string, string> = {
  legendary: "legendary",
  solid: "solid code",
  needs_work: "needs work",
  needs_serious_help: "needs serious help",
}

function parseDiff(diff: string): { type: "added" | "removed" | "context"; code: string }[] {
  return diff.split("\n").map((line) => {
    if (line.startsWith("+") && !line.startsWith("+++"))
      return { type: "added", code: line.slice(1) }
    if (line.startsWith("-") && !line.startsWith("---"))
      return { type: "removed", code: line.slice(1) }
    return { type: "context", code: line.startsWith(" ") ? line.slice(1) : line }
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoastPage({ params }: Props) {
  const { id } = await params
  const roast = await getRoast(id)

  if (!roast) notFound()

  const lang = (roast.language ?? "text") as BundledLanguage
  const diffLines = roast.suggestedFix ? parseDiff(roast.suggestedFix) : []

  const criticals = roast.issues.filter((i) => i.severity === "critical")
  const warnings = roast.issues.filter((i) => i.severity === "warning")
  const goods = roast.issues.filter((i) => i.severity === "good")

  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col gap-12 px-5 pt-12">
        {/* ── back link ── */}
        <Link
          href="/"
          className="flex w-fit items-center gap-2 font-mono text-text-tertiary text-xs transition-colors hover:text-brand"
        >
          &lt;&lt; back_to_home
        </Link>

        {/* ── score + verdict ── */}
        <section className="flex flex-col items-center gap-6 text-center">
          <ScoreRing score={roast.score} />
          <div className="flex flex-col gap-2">
            <span className="font-mono text-text-tertiary text-xs uppercase tracking-widest">
              verdict: {VERDICT_LABELS[roast.verdict] ?? roast.verdict}
            </span>
            <p className="max-w-xl font-['IBM_Plex_Mono',ui-monospace,monospace] text-sm text-text-secondary">
              {`"${roast.roastQuote}"`}
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-text-tertiary text-xs">
            <span>{roast.lineCount} lines</span>
            <span>·</span>
            <span>{roast.language ?? "unknown"}</span>
            <span>·</span>
            <span>{roast.mode === "full_roast" ? "full roast mode" : "brutally honest"}</span>
          </div>
        </section>

        {/* ── submitted code ── */}
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-text-tertiary text-xs uppercase tracking-widest">
            {"// submitted_code"}
          </h2>
          <CodeBlock.Root>
            <CodeBlock.Header filename={`submission.${roast.language ?? "txt"}`} />
            <CodeBlock.Body code={roast.code} lang={lang} />
          </CodeBlock.Root>
        </section>

        {/* ── analysis ── */}
        {roast.issues.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="font-mono text-text-tertiary text-xs uppercase tracking-widest">
              {"// analysis"}
            </h2>

            {criticals.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-critical text-xs">
                  critical ({criticals.length})
                </span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {criticals.map((issue) => (
                    <AnalysisCard.Root key={issue.id}>
                      <AnalysisCard.Badge variant="critical" />
                      <AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
                      <AnalysisCard.Description>{issue.description}</AnalysisCard.Description>
                    </AnalysisCard.Root>
                  ))}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-warning text-xs">warnings ({warnings.length})</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {warnings.map((issue) => (
                    <AnalysisCard.Root key={issue.id}>
                      <AnalysisCard.Badge variant="warning" />
                      <AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
                      <AnalysisCard.Description>{issue.description}</AnalysisCard.Description>
                    </AnalysisCard.Root>
                  ))}
                </div>
              </div>
            )}

            {goods.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-good text-xs">good ({goods.length})</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {goods.map((issue) => (
                    <AnalysisCard.Root key={issue.id}>
                      <AnalysisCard.Badge variant="good" />
                      <AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
                      <AnalysisCard.Description>{issue.description}</AnalysisCard.Description>
                    </AnalysisCard.Root>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── suggested fix diff ── */}
        {diffLines.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-mono text-text-tertiary text-xs uppercase tracking-widest">
              {"// suggested_fix"}
            </h2>
            <div className="flex flex-col overflow-hidden border border-border">
              {diffLines.map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no stable id
                <DiffLine key={i} type={line.type} code={line.code} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
