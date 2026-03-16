# Leaderboard Page — Design Spec

**Date:** 2026-03-16  
**Status:** Approved

## Goal

Wire the `/leaderboard` page to real database data. Replace static mock entries and stats with live tRPC-backed Server Components, using the same patterns already established in the homepage (`LeaderboardPreview`, `RoastMetrics`).

---

## Constraints

- Show exactly 20 entries, no pagination.
- Reuse `LeaderboardCard` (with show-more expand, fade overlay, Shiki syntax highlight, "view roast" link) — no new card design.
- Follow the existing Server Component + Suspense + skeleton loading pattern.
- No new tRPC procedures needed; `roasts.leaderboard({ limit: 20 })` and `roasts.stats()` already exist and cover all required data.

---

## Architecture

No backend changes. The existing `roasts.leaderboard` procedure accepts `limit: 1–50` and returns all fields `LeaderboardCard` needs. Stats come from `roasts.stats()`.

```
LeaderboardPage (Server Component)
  └─ <Suspense fallback={<RoastMetricsSkeleton />}>
       └─ <RoastMetrics />  →  caller.roasts.stats()
  └─ <Suspense fallback={<LeaderboardFullSkeleton />}>
       └─ <LeaderboardFull />  →  caller.roasts.leaderboard({ limit: 20 })
            └─ LeaderboardCard × 20
                 └─ <CodeBlock.Body> (Shiki, async Server Component)
```

---

## New file: `src/components/ui/leaderboard-full.tsx`

Two named exports mirroring `leaderboard-preview.tsx`:

### `LeaderboardFull`

Async Server Component. Calls `caller.roasts.leaderboard({ limit: 20 })` directly (no HTTP round-trip). Maps each row to a `LeaderboardCard` with `<CodeBlock.Body>` as the `codeBlock` prop (same pattern as `LeaderboardPreview`).

### `LeaderboardFullSkeleton`

Renders 5 skeleton cards matching the structure of `LeaderboardCard`: meta row with rank/score placeholders on the left, language/lines on the right, followed by animated code-line bars, then an action bar with two placeholder buttons. Uses `bg-bg-elevated animate-pulse rounded-sm` bars per skeleton conventions.

---

## Updated: `src/app/leaderboard/page.tsx`

- **Remove:** `ENTRIES` array, `STATS` constant, `LeaderboardEntry` type, `ScoreValue` helper (already handled by `LeaderboardCard`).
- **Hero section:** keep existing `h1` and subtitle markup unchanged. Replace the static stats span with `<Suspense fallback={<RoastMetricsSkeleton />}><RoastMetrics /></Suspense>`.
- **Entries section:** replace `ENTRIES.map(...)` with `<Suspense fallback={<LeaderboardFullSkeleton />}><LeaderboardFull /></Suspense>`.
- **Bottom link:** keep the existing "back to roast" link unchanged.

---

## Files changed

| File | Action |
|------|--------|
| `src/components/ui/leaderboard-full.tsx` | Create |
| `src/app/leaderboard/page.tsx` | Update |

## Files unchanged

| File | Reason |
|------|--------|
| `src/trpc/routers/roasts.ts` | `leaderboard` procedure already supports limit 1–50 |
| `src/components/ui/leaderboard-card.tsx` | Reused as-is |
| `src/components/ui/code-block.tsx` | Reused as-is |
| `src/components/ui/roast-metrics.tsx` | Reused as-is |

---

## Skeleton conventions (from AGENTS.md)

- Bar color: `bg-bg-elevated animate-pulse`
- Shape: `rounded-sm` for text-line bars
- Geometry must pixel-match the real card: same `h-12` meta row, same `border-border border-b`, same action bar height
- 5 skeleton entries is sufficient (same reasoning as `LeaderboardPreviewSkeleton` using 3)
