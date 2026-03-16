import { asc, avg, count } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { roasts } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "../init"

// ── Cached DB queries ─────────────────────────────────────────────────────────
// `unstable_cache` stores results in Next.js Data Cache (ISR-style).
// `db` is imported directly — same singleton as ctx.db, but ctx is not
// available inside the serialized cache closure.
// Note: each distinct `limit` value produces a separate cache entry.

const getCachedStats = unstable_cache(
  async () => {
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
  },
  ["roasts-stats"],
  { revalidate: 3600, tags: ["roasts-stats"] }
)

const getCachedLeaderboard = unstable_cache(
  async (limit: number) => {
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
  },
  ["roasts-leaderboard"],
  { revalidate: 3600, tags: ["roasts-leaderboard"] }
)

// ── Router ────────────────────────────────────────────────────────────────────

export const roastsRouter = createTRPCRouter({
  stats: baseProcedure.query(() => getCachedStats()),

  leaderboard: baseProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(3) }))
    .query(({ input }) => getCachedLeaderboard(input.limit)),
})
