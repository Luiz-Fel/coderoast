# Leaderboard Page — Design Spec

**Date:** 2026-03-16  
**Status:** Approved

## Goal

Wire the `/leaderboard` page to real database data. Replace static mock entries and stats with live tRPC-backed Server Components, using the same patterns already established in the homepage (`LeaderboardPreview`, `RoastMetrics`). Cache both the stats and leaderboard queries for 1 hour so the DB is not hit on every request.

---

## Constraints

- Show exactly 20 entries, no pagination.
- Reuse `LeaderboardCard` (with show-more expand, fade overlay, Shiki syntax highlight, "view roast" link) — no new card design.
- Follow the existing Server Component + Suspense + skeleton loading pattern.
- No new tRPC procedures needed; `roasts.leaderboard({ limit: 20 })` and `roasts.stats()` already exist and cover all required data.
- Cache leaderboard and stats data for 1 hour using `unstable_cache` from `next/cache`.

---

## Architecture

### Caching strategy

`caller.roasts.*()` calls Drizzle directly in-process — Next.js's `fetch()` cache does not apply. The correct approach is `unstable_cache` from `next/cache`, which wraps any async function and caches its return value in Next.js's Data Cache with ISR semantics.

Two cached functions are added to `src/trpc/routers/roasts.ts`:

- `getCachedStats` — wraps the stats DB query, cache key `["roasts-stats"]`, tag `"roasts-stats"`, `revalidate: 3600`
- `getCachedLeaderboard` — wraps the leaderboard DB query, cache key `["roasts-leaderboard"]`, tag `"roasts-leaderboard"`, `revalidate: 3600`

Inside `unstable_cache` callbacks, `db` is imported directly from `@/db` rather than taken from `ctx.db` — the value is identical (same module-level singleton), but `ctx` is not available in the serialized cache closure.

The tRPC procedures delegate to these cached functions. No component changes are needed.

### Data flow

```
LeaderboardPage (Server Component)
  └─ <Suspense fallback={<RoastMetricsSkeleton />}>
       └─ <RoastMetrics />  →  caller.roasts.stats()  →  getCachedStats()  →  DB (cached 1h)
  └─ <Suspense fallback={<LeaderboardFullSkeleton />}>
       └─ <LeaderboardFull />  →  caller.roasts.leaderboard({ limit: 20 })  →  getCachedLeaderboard(20)  →  DB (cached 1h)
            └─ LeaderboardCard × 20
                 └─ <CodeBlock.Body> (Shiki, async Server Component)
```

---

## New file: `src/components/ui/leaderboard-full.tsx`

Two named exports mirroring `leaderboard-preview.tsx`:

### `LeaderboardFull`

Async Server Component. Calls `caller.roasts.leaderboard({ limit: 20 })` directly (no HTTP round-trip). Maps each row to a `LeaderboardCard` with `<CodeBlock.Body code={row.code} lang={row.language ?? "plaintext"} />` as the `codeBlock` prop. Use `row.code` (full code), not `row.codePreview` — `codePreview` is a truncated string returned by the procedure but not used for rendering. This matches the pattern in `LeaderboardPreview`.

### `LeaderboardFullSkeleton`

Renders 5 skeleton cards matching the structure of `LeaderboardCard`: meta row with rank/score placeholders on the left, language/lines on the right, followed by animated code-line bars, then an action bar with two placeholder buttons. The action bar must include `bg-bg-surface border-border border-t px-4 py-2` to match the real card's action bar. Uses `bg-bg-elevated animate-pulse rounded-sm` bars per skeleton conventions.

Use a `SKELETON_LINE_COUNTS` constant array (e.g. `[8, 5, 12, 7, 10]`) to vary the code block height per card, matching the pattern in `LeaderboardPreviewSkeleton`.

---

## Updated: `src/app/leaderboard/page.tsx`

**Important:** the current `leaderboard/page.tsx` does not use `LeaderboardCard` at all. It renders a custom card layout — a `<Link>` wrapping an inline border `<div>` with its own meta row, `<CodeBlock.Root>/<CodeBlock.Body>`, and `ScoreValue` helper. This entire custom card markup and its `<Link>` wrapper are removed and replaced.

- **Remove:** `ENTRIES` array, `STATS` constant, `LeaderboardEntry` type, `ScoreValue` helper, the `CodeBlock` import (no longer needed directly in the page).
- **Hero section:** keep existing `h1` and subtitle markup unchanged. Replace the **entire** `<div className="flex items-center gap-2 ...">` wrapper that contains the static stats with `<Suspense fallback={<RoastMetricsSkeleton />}><RoastMetrics /></Suspense>`. `RoastMetrics` renders its own container — do not keep the outer stats wrapper div.
- **Entries section:** replace the entire `ENTRIES.map(...)` block (including each `<Link>` wrapper and inline card markup) with `<Suspense fallback={<LeaderboardFullSkeleton />}><LeaderboardFull /></Suspense>`.
- **Bottom link:** keep the existing "back to roast" link unchanged.
- **Imports:** add `Suspense` from React; add `RoastMetrics`, `RoastMetricsSkeleton` from `@/components/ui/roast-metrics`; add `LeaderboardFull`, `LeaderboardFullSkeleton` from `@/components/ui/leaderboard-full`. Remove unused `CodeBlock` import (Biome enforces no unused imports).

---

## Files changed

| File | Action |
|------|--------|
| `src/trpc/routers/roasts.ts` | Update — add `unstable_cache` wrappers |
| `src/components/ui/leaderboard-full.tsx` | Create |
| `src/app/leaderboard/page.tsx` | Update |

## Files unchanged

| File | Reason |
|------|--------|
| `src/components/ui/leaderboard-card.tsx` | Reused as-is |
| `src/components/ui/code-block.tsx` | Reused as-is |
| `src/components/ui/roast-metrics.tsx` | Reused as-is |

---

## Skeleton conventions (from AGENTS.md)

- Bar color: `bg-bg-elevated animate-pulse`
- Shape: `rounded-sm` for text-line bars
- Geometry must pixel-match the real card: same `h-12` meta row, same `border-border border-b`, code block area uses `flex flex-col gap-1.5 p-3`, same action bar height
- 5 skeleton entries with varying line counts via `SKELETON_LINE_COUNTS = [8, 5, 12, 7, 10]`

---

## Notes on `roasts.leaderboard` return shape

The procedure returns `id`, `score`, `code`, `lineCount`, `codePreview`, `language` from the DB, plus `rank` computed as `index + 1` in the `.map()`. `rank` is not a DB column. `codePreview` is a pre-truncated string that is not used by `LeaderboardCard` — pass `row.code` instead.
