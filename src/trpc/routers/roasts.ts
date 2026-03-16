import { TRPCError } from "@trpc/server"
import { asc, avg, count } from "drizzle-orm"
import { revalidateTag, unstable_cache } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { roastIssues, roasts } from "@/db/schema"
import { analyzeCode } from "@/lib/ai/client"
import { enforceRateLimit } from "@/lib/rate-limit"
import { MAX_ROAST_CHARS, ROAST_MODES, scoreToVerdict } from "@/lib/roast"
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

function getCreateRoastRateLimitConfig() {
  const limit = Number(process.env.ROAST_CREATE_RATE_LIMIT ?? 5)
  const windowSeconds = Number(process.env.ROAST_CREATE_RATE_WINDOW_SECONDS ?? 60)

  return {
    scope: "roast-create",
    limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5,
    windowMs:
      Number.isFinite(windowSeconds) && windowSeconds > 0
        ? Math.floor(windowSeconds * 1000)
        : 60_000,
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export const roastsRouter = createTRPCRouter({
  stats: baseProcedure.query(() => getCachedStats()),

  leaderboard: baseProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(3) }))
    .query(({ input }) => getCachedLeaderboard(input.limit)),

  create: baseProcedure
    .input(
      z.object({
        code: z.string().trim().min(1).max(MAX_ROAST_CHARS),
        mode: z.enum(ROAST_MODES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimit = await enforceRateLimit(ctx.req, getCreateRoastRateLimitConfig())

      if (!rateLimit.allowed) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
        )

        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many roasts from this IP. Try again in ${retryAfterSeconds}s.`,
        })
      }

      const normalizedCode = input.code.replace(/\r\n?/g, "\n").trimEnd()
      const lineCount = normalizedCode.split("\n").length
      const result = await analyzeCode({
        code: normalizedCode,
        mode: input.mode,
      })

      const [roast] = await ctx.db
        .insert(roasts)
        .values({
          code: normalizedCode,
          language: result.language,
          lineCount,
          mode: input.mode,
          score: result.score.toFixed(2),
          verdict: scoreToVerdict(result.score),
          roastQuote: result.roastQuote,
          suggestedFix: result.suggestedFix ?? null,
        })
        .returning({ id: roasts.id })

      if (result.issues.length > 0) {
        await ctx.db.insert(roastIssues).values(
          result.issues.map((issue, index) => ({
            roastId: roast.id,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            sortOrder: index,
          }))
        )
      }

      revalidateTag("roasts-stats", "max")
      revalidateTag("roasts-leaderboard", "max")

      return { id: roast.id }
    }),
})
