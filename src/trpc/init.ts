import { initTRPC } from "@trpc/server"
import { db } from "@/db"

type TRPCContextOptions = {
  req?: Request
}

export async function createTRPCContext(opts?: TRPCContextOptions) {
  return {
    db,
    req: opts?.req,
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
