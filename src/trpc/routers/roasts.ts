import { avg, count } from "drizzle-orm"
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
})
