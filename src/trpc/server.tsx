import "server-only"

import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { headers } from "next/headers"
import { cache } from "react"
import { createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"

export const getQueryClient = cache(makeQueryClient)

const getRequestFromHeaders = cache(async () => {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  const realIp = h.get("x-real-ip")

  return new Request("http://localhost", {
    headers: {
      ...(forwarded ? { "x-forwarded-for": forwarded } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  })
})

const createServerContext = cache(async () => {
  const req = await getRequestFromHeaders()
  return createTRPCContext({ req })
})

export const trpc = createTRPCOptionsProxy({
  ctx: createServerContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export const caller = appRouter.createCaller(createServerContext)

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
}

// biome-ignore lint/suspicious/noExplicitAny: generic helper mirrors tRPC docs
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(queryOptions)
}
