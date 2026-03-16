import { asc, avg, count } from "drizzle-orm"
import { z } from "zod"
import { roasts } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "../init"

export const roastsRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        total: count(roasts.id),
        avgScore: avg(roasts.score),
      })
      .from(roasts)

    return {
      total: row?.total ?? 0,
      avgScore: Number(row?.avgScore ?? 0),
    }
  }),

  leaderboard: baseProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(3) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: roasts.id,
          score: roasts.score,
          code: roasts.code,
          language: roasts.language,
          lineCount: roasts.lineCount,
        })
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(input.limit)

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
    }),
})
