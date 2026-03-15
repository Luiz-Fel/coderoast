import { createTRPCRouter } from "../init"
import { roastsRouter } from "./roasts"

export const appRouter = createTRPCRouter({
  roasts: roastsRouter,
})

export type AppRouter = typeof appRouter
