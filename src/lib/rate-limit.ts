import { and, eq, lt, sql } from "drizzle-orm"
import { db } from "@/db"
import { roastRateLimits } from "@/db/schema"

export type RateLimitConfig = {
  scope: string
  limit: number
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export function getWindowStart(now: Date, windowMs: number): Date {
  const start = Math.floor(now.getTime() / windowMs) * windowMs
  return new Date(start)
}

export function getClientIpFromRequest(req?: Request): string {
  if (!req) return "unknown"

  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

export function buildRateLimitKey(scope: string, ip: string): string {
  return `${scope}:${ip}`
}

async function incrementWindowCount(key: string, windowStart: Date): Promise<number> {
  const [row] = await db
    .insert(roastRateLimits)
    .values({
      key,
      windowStart,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [roastRateLimits.key, roastRateLimits.windowStart],
      set: {
        count: sql`${roastRateLimits.count} + 1`,
      },
    })
    .returning({ count: roastRateLimits.count })

  return row.count
}

export async function enforceRateLimit(
  req: Request | undefined,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = getWindowStart(now, config.windowMs)
  const resetAt = new Date(windowStart.getTime() + config.windowMs)
  const key = buildRateLimitKey(config.scope, getClientIpFromRequest(req))

  await db
    .delete(roastRateLimits)
    .where(
      and(
        eq(roastRateLimits.key, key),
        lt(roastRateLimits.windowStart, new Date(windowStart.getTime() - config.windowMs * 2))
      )
    )

  const currentCount = await incrementWindowCount(key, windowStart)
  const remaining = Math.max(0, config.limit - currentCount)

  return {
    allowed: currentCount <= config.limit,
    remaining,
    resetAt,
  }
}
