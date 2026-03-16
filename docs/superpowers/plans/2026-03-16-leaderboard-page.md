# Leaderboard Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `/leaderboard` page to real DB data using `LeaderboardCard`, cache leaderboard and stats queries for 1 hour via `unstable_cache`.

**Architecture:** Add `unstable_cache` wrappers to the two read queries in `roasts.ts` so every call — from both the homepage and the leaderboard page — hits Next.js's Data Cache instead of the DB on every request. Create a `LeaderboardFull` Server Component + skeleton mirroring `LeaderboardPreview`. Rewrite `leaderboard/page.tsx` to use `<Suspense>` + the new component + `RoastMetrics`.

**Tech Stack:** Next.js 16 App Router, tRPC v11, Drizzle ORM (postgres-js), `unstable_cache` (next/cache), Shiki (via `CodeBlock.Body`), Tailwind v4, Biome

**Spec:** `docs/superpowers/specs/2026-03-16-leaderboard-page-design.md`

---

## Chunk 1: Cache the DB queries in the tRPC router

### Task 1: Add `unstable_cache` to `roasts.ts`

**Files:**
- Modify: `src/trpc/routers/roasts.ts`

The `caller.*()` path calls Drizzle in-process — Next.js's `fetch()` cache doesn't apply. `unstable_cache` wraps any async function and stores its result in Next.js's Data Cache with `revalidate` TTL and `tags` for on-demand invalidation.

- [ ] **Step 1: Rewrite `src/trpc/routers/roasts.ts`**

Replace the file content with:

```ts
import { unstable_cache } from "next/cache"
import { asc, avg, count } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { roasts } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "../init"

// ── Cached DB queries ─────────────────────────────────────────────────────────
// `unstable_cache` stores results in Next.js Data Cache (ISR-style).
// `db` is imported directly — same singleton as ctx.db, but ctx is not
// available inside the serialized cache closure.

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
```

Key differences from original:
- `unstable_cache` wraps each DB query at module scope
- `db` imported from `@/db` directly (not from `ctx.db`) — `ctx` is not passed into the cache closure
- The `stats` and `leaderboard` procedures now simply call the cached functions; they no longer use `ctx.db` so the `ctx` destructure is removed

- [ ] **Step 2: Verify Biome passes**

```bash
npx biome check src/trpc/routers/roasts.ts
```

Expected: no errors or warnings. If there are import order issues, Biome will tell you; reorder imports to match (usually: external packages first, then internal `@/` aliases).

- [ ] **Step 3: Commit**

```bash
git add src/trpc/routers/roasts.ts
git commit -m "feat: cache leaderboard and stats queries for 1h with unstable_cache"
```

---

## Chunk 2: Create `LeaderboardFull` component

### Task 2: Create `src/components/ui/leaderboard-full.tsx`

**Files:**
- Create: `src/components/ui/leaderboard-full.tsx`

Reference implementation: `src/components/ui/leaderboard-preview.tsx`. The only differences are:
- `limit: 20` instead of `limit: 3`
- Skeleton uses 5 entries instead of 3, with `SKELETON_LINE_COUNTS = [8, 5, 12, 7, 10]`

- [ ] **Step 1: Create the file**

```tsx
import { caller } from "@/trpc/server"
import { CodeBlock } from "./code-block"
import { LeaderboardCard } from "./leaderboard-card"

// ─── LeaderboardFull ─────────────────────────────────────────────────────────

export async function LeaderboardFull() {
  const rows = await caller.roasts.leaderboard({ limit: 20 })

  return (
    <div className="flex flex-col gap-5">
      {rows.map((row) => (
        <LeaderboardCard
          key={row.id}
          id={row.id}
          rank={row.rank}
          score={row.score}
          language={row.language}
          lineCount={row.lineCount}
          codeBlock={
            <CodeBlock.Body code={row.code} lang={(row.language ?? "plaintext") as never} />
          }
        />
      ))}
    </div>
  )
}

// ─── LeaderboardFullSkeleton ──────────────────────────────────────────────────

const SKELETON_LINE_COUNTS = [8, 5, 12, 7, 10]

export function LeaderboardFullSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {SKELETON_LINE_COUNTS.map((lines, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, order never changes
          key={i}
          className="flex flex-col border border-border"
        >
          {/* meta row */}
          <div className="flex h-12 items-center justify-between border-border border-b px-5">
            <div className="flex items-center gap-4">
              <span className="inline-block h-[12px] w-20 animate-pulse rounded-sm bg-bg-elevated" />
              <span className="inline-block h-[12px] w-16 animate-pulse rounded-sm bg-bg-elevated" />
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-[12px] w-14 animate-pulse rounded-sm bg-bg-elevated" />
              <span className="inline-block h-[12px] w-10 animate-pulse rounded-sm bg-bg-elevated" />
            </div>
          </div>

          {/* code lines */}
          <div className="flex flex-col gap-1.5 p-3">
            {Array.from({ length: lines }, (_, j) => j + 1).map((n) => (
              <span
                key={n}
                className="inline-block h-[13px] animate-pulse rounded-sm bg-bg-elevated"
                style={{ width: `${45 + ((n * 37) % 45)}%` }}
              />
            ))}
          </div>

          {/* action bar */}
          <div className="flex items-center justify-end gap-4 border-border border-t bg-bg-surface px-4 py-2">
            <span className="inline-block h-[11px] w-16 animate-pulse rounded-sm bg-bg-elevated" />
            <span className="inline-block h-[11px] w-14 animate-pulse rounded-sm bg-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify Biome passes**

```bash
npx biome check src/components/ui/leaderboard-full.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/leaderboard-full.tsx
git commit -m "feat: add LeaderboardFull component and skeleton"
```

---

## Chunk 3: Wire up the leaderboard page

### Task 3: Rewrite `src/app/leaderboard/page.tsx`

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

**What changes:**
- Remove all static data (`ENTRIES`, `STATS`, `LeaderboardEntry` type, `ScoreValue` helper)
- Remove the `CodeBlock` import (unused after this change)
- Add `Suspense` import from React
- Add `RoastMetrics`, `RoastMetricsSkeleton` from `@/components/ui/roast-metrics`
- Add `LeaderboardFull`, `LeaderboardFullSkeleton` from `@/components/ui/leaderboard-full`
- Replace the static stats `<div>` wrapper with `<Suspense><RoastMetrics /></Suspense>`
- Replace the entire `ENTRIES.map(...)` entries section with `<Suspense><LeaderboardFull /></Suspense>`
- Keep the `h1`, subtitle, and "back to roast" link unchanged

- [ ] **Step 1: Replace `src/app/leaderboard/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LeaderboardFull, LeaderboardFullSkeleton } from "@/components/ui/leaderboard-full"
import { RoastMetrics, RoastMetricsSkeleton } from "@/components/ui/roast-metrics"

export const metadata: Metadata = {
  title: "shame_leaderboard — coderoast",
  description: "The most roasted code on the internet, ranked by shame.",
}

export default async function LeaderboardPage() {
  return (
    <main className="pb-20">
      <div className="mx-auto flex max-w-[960px] flex-col gap-10 px-5 pt-10">
        {/* ── hero ── */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="flex items-baseline gap-3 font-bold font-mono text-3xl">
              <span className="text-brand">&gt;</span>
              <span className="text-text-primary">shame_leaderboard</span>
            </h1>
            <p className="font-mono-alt text-sm text-text-secondary">
              {"// the most roasted code on the internet"}
            </p>
          </div>

          <Suspense fallback={<RoastMetricsSkeleton />}>
            <RoastMetrics />
          </Suspense>
        </section>

        {/* ── entries ── */}
        <section className="flex flex-col gap-5">
          <Suspense fallback={<LeaderboardFullSkeleton />}>
            <LeaderboardFull />
          </Suspense>
        </section>

        {/* ── back to home ── */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="border border-border px-4 py-2 font-mono text-text-secondary text-xs transition-colors hover:border-brand hover:text-brand"
          >
            &lt; back to roast
          </Link>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify Biome passes**

```bash
npx biome check src/app/leaderboard/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Build to catch type errors**

```bash
npx next build
```

Expected: build succeeds with no TypeScript errors. If there are errors in `leaderboard-full.tsx` relating to the `lang` prop cast, confirm it matches the pattern used in `leaderboard-preview.tsx` (`(row.language ?? "plaintext") as never`).

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat: wire leaderboard page to live data with Suspense and RoastMetrics"
```
