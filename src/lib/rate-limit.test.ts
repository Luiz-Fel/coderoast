import assert from "node:assert/strict"
import test from "node:test"
import { buildRateLimitKey, getClientIpFromRequest, getWindowStart } from "@/lib/rate-limit"

test("getClientIpFromRequest prefers first x-forwarded-for ip", () => {
  const req = new Request("https://example.com", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 198.51.100.2",
      "x-real-ip": "198.51.100.3",
    },
  })

  assert.equal(getClientIpFromRequest(req), "203.0.113.10")
})

test("getClientIpFromRequest falls back to x-real-ip", () => {
  const req = new Request("https://example.com", {
    headers: {
      "x-real-ip": "198.51.100.3",
    },
  })

  assert.equal(getClientIpFromRequest(req), "198.51.100.3")
})

test("getWindowStart rounds down to fixed window", () => {
  const windowMs = 60_000
  const date = new Date("2026-03-16T12:34:56.789Z")

  const windowStart = getWindowStart(date, windowMs)

  assert.equal(windowStart.toISOString(), "2026-03-16T12:34:00.000Z")
})

test("buildRateLimitKey includes scope and ip", () => {
  assert.equal(buildRateLimitKey("roast-create", "203.0.113.10"), "roast-create:203.0.113.10")
})
