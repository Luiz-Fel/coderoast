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
- Geometry must pixel-match the real card: same `h-12` meta row, same `border-border border-b`, code block area uses `flex flex-col gap-1.5 p-3`, same action bar height
- 5 skeleton entries with varying line counts via `SKELETON_LINE_COUNTS = [8, 5, 12, 7, 10]`

---

## Notes on `roasts.leaderboard` return shape

The procedure returns `id`, `score`, `code`, `lineCount`, `codePreview`, `language` from the DB, plus `rank` computed as `index + 1` in the `.map()`. `rank` is not a DB column. `codePreview` is a pre-truncated string that is not used by `LeaderboardCard` — pass `row.code` instead.
