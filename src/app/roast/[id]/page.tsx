import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { BundledLanguage } from "shiki"
import { AnalysisCard } from "@/components/ui/analysis-card"
import { CodeBlock } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { ScoreRing } from "@/components/ui/score-ring"
import { ShareButton } from "@/components/ui/share-button"
import { caller } from "@/trpc/server"

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  let roast: Awaited<ReturnType<typeof caller.roasts.getById>>
  try {
    roast = await caller.roasts.getById({ id })
  } catch {
    return {}
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const ogImageUrl = `${appUrl}/api/og/${id}`
  const title = `${roast.score}/10 — ${roast.verdict} | coderoast`
  const description = roast.roastQuote

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERDICT_LABELS: Record<string, string> = {
  legendary: "legendary",
  solid: "solid code",
  needs_work: "needs work",
  needs_serious_help: "needs serious help",
}

type VerdictColor = "text-good" | "text-warning" | "text-critical"
type DotColor = "bg-accent-green" | "bg-accent-amber" | "bg-accent-red"

function scoreToVerdictColor(score: number): { text: VerdictColor; dot: DotColor } {
  if (score > 7) return { text: "text-good", dot: "bg-accent-green" }
  if (score >= 4) return { text: "text-warning", dot: "bg-accent-amber" }
  return { text: "text-critical", dot: "bg-accent-red" }
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ prompt, title }: { prompt: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold font-mono text-brand text-sm">{prompt}</span>
      <span className="font-bold font-mono text-sm text-text-primary">{title}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-px w-full bg-border" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ id: string }>
}

function RoastPageSkeleton() {
  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col gap-10 px-5 pt-12">
        <div className="h-3 w-24 animate-pulse rounded-sm bg-bg-elevated" />
        <div className="h-56 animate-pulse rounded-sm bg-bg-elevated" />
        <div className="h-px w-full bg-border" />
        <div className="h-72 animate-pulse rounded-sm bg-bg-elevated" />
      </div>
    </main>
  )
}

async function RoastPageContent({ params }: Props) {
  const { id } = await params

  let roast: Awaited<ReturnType<typeof caller.roasts.getById>>
  try {
    roast = await caller.roasts.getById({ id })
  } catch {
    notFound()
  }

  const lang = (roast.language ?? "text") as BundledLanguage
  const diffLines = roast.suggestedFix ? parseDiff(roast.suggestedFix) : []
  const { text: verdictText, dot: verdictDot } = scoreToVerdictColor(roast.score)
  const ext = roast.language ?? "txt"

  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col gap-10 px-5 pt-12">
        {/* ── back link ── */}
        <Link
          href="/"
          className="flex w-fit items-center gap-2 font-mono text-text-tertiary text-xs transition-colors hover:text-brand"
        >
          &lt;&lt; back_to_home
        </Link>

        {/* ── score hero ── */}
        <section className="flex items-center gap-12">
          <ScoreRing score={roast.score} />

          <div className="flex flex-1 flex-col gap-4">
            {/* verdict badge */}
            <div className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${verdictDot}`} />
              <span className={`font-medium font-mono text-xs ${verdictText}`}>
                verdict: {VERDICT_LABELS[roast.verdict] ?? roast.verdict}
              </span>
            </div>

            {/* roast quote */}
            <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-primary text-xl leading-relaxed">
              {`"${roast.roastQuote}"`}
            </p>

            {/* meta */}
            <div className="flex items-center gap-4 font-mono text-text-tertiary text-xs">
              <span>lang: {roast.language ?? "unknown"}</span>
              <span>·</span>
              <span>{roast.lineCount} lines</span>
              <span>·</span>
              <span>mode: {roast.mode}</span>
            </div>

            <ShareButton className="w-fit" />
          </div>
        </section>

        <Divider />

        {/* ── submitted code ── */}
        <section className="flex flex-col gap-4">
          <SectionHeader prompt="//" title="your_submission" />
          <CodeBlock.Root>
            <CodeBlock.Header filename={`submission.${ext}`} />
            <CodeBlock.Body code={roast.code} lang={lang} />
          </CodeBlock.Root>
        </section>

        {roast.issues.length > 0 && <Divider />}

        {/* ── detailed analysis ── */}
        {roast.issues.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader prompt="//" title="detailed_analysis" />

            <div className="grid grid-cols-2 gap-5">
              {roast.issues.map((issue) => (
                <AnalysisCard.Root key={issue.id}>
                  <AnalysisCard.Badge variant={issue.severity} />
                  <AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
                  <AnalysisCard.Description>{issue.description}</AnalysisCard.Description>
                </AnalysisCard.Root>
              ))}
            </div>
          </section>
        )}

        {diffLines.length > 0 && <Divider />}

        {/* ── suggested fix ── */}
        {diffLines.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeader prompt="//" title="suggested_fix" />

            <div className="overflow-hidden border border-border">
              {/* diff header */}
              <CodeBlock.Header>
                <span className="font-medium font-mono text-text-secondary text-xs">
                  submission.{ext} → improved.{ext}
                </span>
              </CodeBlock.Header>

              {/* diff lines */}
              <div className="flex flex-col">
                {diffLines.map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no stable id
                  <DiffLine key={i} type={line.type} code={line.code} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default function RoastPage({ params }: Props) {
  return (
    <Suspense fallback={<RoastPageSkeleton />}>
      <RoastPageContent params={params} />
    </Suspense>
  )
}
