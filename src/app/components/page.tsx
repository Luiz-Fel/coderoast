import { Suspense } from "react"
import { AnalysisCard } from "@/components/ui/analysis-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import { LeaderboardRow } from "@/components/ui/leaderboard-row"
import { ScoreRing } from "@/components/ui/score-ring"
import { ToggleDemo } from "./toggle-demo"

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"
type Rounded = "none" | "sm" | "md" | "full"

const variants: Variant[] = ["primary", "secondary", "outline", "ghost", "danger"]
const sizes: Size[] = ["sm", "md", "lg"]
const roundeds: Rounded[] = ["none", "sm", "md", "full"]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium text-text-secondary text-xs uppercase tracking-widest">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <span className="w-24 shrink-0 text-right font-mono text-text-tertiary text-xs">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const SAMPLE_CODE = `function roast(code: string) {
  const issues = analyze(code)
  return issues.map(i => i.message)
}`

export default async function ComponentsPage() {
  return (
    <main className="min-h-screen bg-bg px-16 py-14">
      <div className="flex max-w-4xl flex-col gap-12">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-lg text-text-primary">UI Components</h1>
          <p className="text-sm text-text-secondary">
            Biblioteca de componentes visuais do projeto.
          </p>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Button */}
        <Section title="Button">
          <Row label="variant">
            {variants.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </Row>
          <Row label="size">
            {sizes.map((s) => (
              <Button key={s} size={s}>
                {s}
              </Button>
            ))}
          </Row>
          <Row label="rounded">
            {roundeds.map((r) => (
              <Button key={r} rounded={r}>
                {r}
              </Button>
            ))}
          </Row>
          <Row label="disabled">
            {variants.map((v) => (
              <Button key={v} variant={v} disabled>
                {v}
              </Button>
            ))}
          </Row>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* Badge */}
        <Section title="Badge">
          <Row label="variant">
            <Badge variant="good" label="good" />
            <Badge variant="warning" label="warning" />
            <Badge variant="critical" label="critical" />
          </Row>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* Toggle */}
        <Section title="Toggle">
          <Row label="default">
            <ToggleDemo />
          </Row>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* ScoreRing */}
        <Section title="ScoreRing">
          <Row label="scores">
            <ScoreRing score={9.2} />
            <ScoreRing score={6.5} size={140} />
            <ScoreRing score={2.8} size={100} />
          </Row>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* AnalysisCard */}
        <Section title="AnalysisCard">
          <div className="grid grid-cols-3 gap-4">
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="good" />
              <AnalysisCard.Title>Naming conventions</AnalysisCard.Title>
              <AnalysisCard.Description>
                Variables and functions follow camelCase consistently. No ambiguous abbreviations
                found.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="warning" />
              <AnalysisCard.Title>Error handling</AnalysisCard.Title>
              <AnalysisCard.Description>
                Some async calls are missing try/catch blocks. Unhandled rejections may crash the
                process.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="critical" />
              <AnalysisCard.Title>SQL injection risk</AnalysisCard.Title>
              <AnalysisCard.Description>
                User input is concatenated directly into the query string without sanitization or
                parameterization.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
          </div>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* DiffLine */}
        <Section title="DiffLine">
          <div className="flex flex-col overflow-hidden rounded border border-border">
            <DiffLine type="context" code="export function greet(name: string) {" />
            <DiffLine type="removed" code='  return "Hello " + name' />
            <DiffLine type="added" code="  return `Hello, ${name}!`" />
            <DiffLine type="context" code="}" />
          </div>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* CodeBlock */}
        <Section title="CodeBlock">
          <CodeBlock.Root>
            <CodeBlock.Header filename="roast.ts" />
            <Suspense fallback={<div className="h-28 animate-pulse rounded-sm bg-bg-elevated" />}>
              <CodeBlock.Body code={SAMPLE_CODE} lang="typescript" />
            </Suspense>
          </CodeBlock.Root>
        </Section>

        <div className="h-px w-full bg-border" />

        {/* LeaderboardRow */}
        <Section title="LeaderboardRow">
          <div className="flex flex-col overflow-hidden rounded border border-border">
            <LeaderboardRow.Root>
              <LeaderboardRow.Rank>1</LeaderboardRow.Rank>
              <LeaderboardRow.Score value={9.4} />
              <LeaderboardRow.Code>
                {"function fibonacci(n) { if (n <= 1) return n; return fib..."}
              </LeaderboardRow.Code>
              <LeaderboardRow.Language>TypeScript</LeaderboardRow.Language>
            </LeaderboardRow.Root>
            <LeaderboardRow.Root>
              <LeaderboardRow.Rank>2</LeaderboardRow.Rank>
              <LeaderboardRow.Score value={6.1} />
              <LeaderboardRow.Code>
                {'SELECT * FROM users WHERE id = " + req.params.id'}
              </LeaderboardRow.Code>
              <LeaderboardRow.Language>SQL</LeaderboardRow.Language>
            </LeaderboardRow.Root>
            <LeaderboardRow.Root>
              <LeaderboardRow.Rank>3</LeaderboardRow.Rank>
              <LeaderboardRow.Score value={2.3} />
              <LeaderboardRow.Code>
                {"var x=1;var y=2;var z=x+y;console.log(z)"}
              </LeaderboardRow.Code>
              <LeaderboardRow.Language>JavaScript</LeaderboardRow.Language>
            </LeaderboardRow.Root>
          </div>
        </Section>
      </div>
    </main>
  )
}
