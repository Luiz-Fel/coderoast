import { asc, avg, count } from "drizzle-orm"
import { db } from "@/db"
import { roasts } from "@/db/schema"

export type LeaderboardRow = {
  id: string
  rank: number
  score: number
  codePreview: string
  language: string | null
}

export type LeaderboardStats = {
  total: number
  avgScore: number
}

export async function getLeaderboard(limit = 3): Promise<LeaderboardRow[]> {
  const rows = await db
    .select({
      id: roasts.id,
      score: roasts.score,
      code: roasts.code,
      language: roasts.language,
    })
    .from(roasts)
    .orderBy(asc(roasts.score))
    .limit(limit)

  return rows.map((row, index) => ({
    id: row.id,
    rank: index + 1,
    score: Number(row.score),
    codePreview: row.code
      .split("\n")
      .slice(0, 3)
      .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
      .join("\n")
      .trim(),
    language: row.language,
  }))
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  const [row] = await db
    .select({
      total: count(roasts.id),
      avgScore: avg(roasts.score),
    })
    .from(roasts)

  return {
    total: row?.total ?? 0,
    avgScore: Number(row?.avgScore ?? 0),
  }
}
