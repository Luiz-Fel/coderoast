import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { roastIssues, roasts } from "@/db/schema"

export type RoastIssue = {
  id: string
  severity: "critical" | "warning" | "good"
  title: string
  description: string
  sortOrder: number
}

export type RoastDetail = {
  id: string
  createdAt: Date
  code: string
  language: string | null
  lineCount: number
  mode: "brutally_honest" | "full_roast"
  score: number
  verdict: "legendary" | "solid" | "needs_work" | "needs_serious_help"
  roastQuote: string
  suggestedFix: string | null
  issues: RoastIssue[]
}

export async function getRoast(id: string): Promise<RoastDetail | null> {
  const [roast] = await db.select().from(roasts).where(eq(roasts.id, id)).limit(1)

  if (!roast) return null

  const issues = await db
    .select()
    .from(roastIssues)
    .where(eq(roastIssues.roastId, id))
    .orderBy(asc(roastIssues.sortOrder))

  return {
    id: roast.id,
    createdAt: roast.createdAt,
    code: roast.code,
    language: roast.language ?? null,
    lineCount: roast.lineCount,
    mode: roast.mode,
    score: Number(roast.score),
    verdict: roast.verdict,
    roastQuote: roast.roastQuote,
    suggestedFix: roast.suggestedFix ?? null,
    issues: issues.map((i) => ({
      id: i.id,
      severity: i.severity,
      title: i.title,
      description: i.description,
      sortOrder: i.sortOrder,
    })),
  }
}
