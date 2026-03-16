import { asc, avg, count } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { roasts } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "../init"

// ── Cached DB queries ─────────────────────────────────────────────────────────
// `use cache` + cacheLife/cacheTag stores results in Next.js Data Cache.
// `db` is imported directly — same singleton as ctx.db.

async function getCachedStats() {
  "use cache"
  cacheLife("hourly")
  cacheTag("roasts-stats")

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

async function getCachedLeaderboard(limit: number) {
  "use cache"
  cacheLife("hourly")
  cacheTag("roasts-leaderboard")

  const rows = await db
    .select({
      id: roasts.id,
      score: roasts.score,
      code: roasts.code,
      language: roasts.language,
      lineCount: roasts.lineCount,
    })
    .from(roasts)
    .orderBy(asc(roasts.score))
    .limit(limit)

  return rows.map((row, index) => ({
    id: row.id,
    rank: index + 1,
    score: Number(row.score),
    code: row.code,
    lineCount: row.lineCount,
    codePreview: row.code
      .split("\n")
      .slice(0, 3)
      .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
      .join("\n")
      .trim(),
    language: row.language,
  }))
}

// ── Router ────────────────────────────────────────────────────────────────────

export const roastsRouter = createTRPCRouter({
  stats: baseProcedure.query(() => getCachedStats()),

  leaderboard: baseProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(3) }))
    .query(({ input }) => getCachedLeaderboard(input.limit)),
})
