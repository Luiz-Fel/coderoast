# CodeRoast — Agent Guidelines

## What this project is

A web app that receives code, rates it with a score 0–10, and returns brutal/humorous AI feedback. Users can compare their results on a public shame leaderboard.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind v4** (`@theme` tokens in `globals.css`) · **tailwind-variants** (`tv()`) · **tailwind-merge** (`twMerge`)
- **Biome** for lint + format (strict — no `eslint`, no `prettier`)
- **Base UI** for headless primitives · **Shiki** for syntax highlighting
- **tRPC v11** + **TanStack React Query** for API layer · **Drizzle ORM** (postgres-js) for DB
- **`@number-flow/react`** (`NumberFlow`) for animated number counters

## Project structure

```
src/
  app/
    layout.tsx              # root layout — renders <Header /> and <TRPCReactProvider>
    page.tsx                # homepage: hero + leaderboard preview
    components/page.tsx     # kitchen sink / component library
    api/trpc/[trpc]/
      route.ts              # tRPC fetch adapter (GET + POST)
    actions/                # Server Actions (legacy — being migrated to tRPC)
  components/
    ui/                     # atomic & composite UI components
      AGENTS.md             # component-level conventions (read this too)
  trpc/
    init.ts                 # initTRPC, createTRPCContext (injects db), baseProcedure
    query-client.ts         # makeQueryClient with staleTime + dehydrate config
    client.tsx              # TRPCReactProvider, useTRPC, singleton browserQueryClient
    server.tsx              # server-only: trpc proxy, caller, HydrateClient, prefetch
    routers/
      _app.ts               # appRouter, AppRouter type
      roasts.ts             # roasts procedures (stats, …)
```

## Key conventions

**Components** (`src/components/ui/`)
- One file per component, kebab-case filename, no barrel `index.ts`
- Extend native HTML props via `ComponentProps<"tag">`
- Composite components use **namespace export**: `export const Foo = { Root, Bar, Baz }`
- Always `twMerge(recipe({ ... }), className)` — never template literals for class merging

**Biome gotchas**
- No array index as React key → use `Array.from({ length }, (_, i) => i + 1)`
- Static lists where order never changes (e.g. skeleton bars) may use index as key with:
  `// biome-ignore lint/suspicious/noArrayIndexKey: static <reason>`
- No bare string starting with `//` in JSX → wrap as `{"// comment"}`
- `dangerouslySetInnerHTML` requires `// biome-ignore lint/security/noDangerouslySetInnerHtml: <reason>`

**Design tokens** — always use project tokens, never hardcoded values:
- Backgrounds: `bg-bg` · `bg-bg-surface` · `bg-bg-elevated`
- Text: `text-text-primary` · `text-text-secondary` · `text-text-tertiary`
- Border: `border-border` · `border-border-focus`
- Accent: `text-brand` / `bg-brand` (`#10b981`) · `text-accent-red` · `text-accent-amber`
- Severity: `text-good` · `text-warning` · `text-critical`

**Score color thresholds** (used in `LeaderboardRow.Score` and `ScoreRing`):
- `< 4` → critical (red) · `4–7` → warning (amber) · `> 7` → good (green)

**Server vs Client**
- Default to Server Components; add `"use client"` only when needed
- `CodeBlock.Body` is an async Server Component (uses `codeToHtml`)
- `CodeInputForm` is a Client Component (`"use client"`)
- `src/trpc/server.tsx` must be `.tsx` (not `.ts`) because it contains JSX (`HydrateClient`)

**Loading states**
- Prefer **Server Components + `<Suspense>` + skeleton components** over client-side spinners or `useEffect`-driven loading flags
- Skeletons live alongside their real component in the same file, exported as `<ComponentName>Skeleton`
- Example: `roast-metrics.tsx` exports both `RoastMetrics` (async Server Component) and `RoastMetricsSkeleton`

**Skeleton conventions**
- Bar geometry must pixel-match the real content: use the same `height`, `lineHeight`, padding, and gap values as the rendered element
- Color: `bg-bg-elevated` with `animate-pulse`
- Shape: `rounded-sm` for text-line bars
- Responsive widths: define two constant arrays (desktop and mobile) and toggle via CSS breakpoints — **never use JS `useMediaQuery` or `window.innerWidth`**:
  ```tsx
  // desktop (≥ sm / 640px)
  <div className="hidden sm:block">
    {DESKTOP_WIDTHS.map((w, i) => <div key={i} style={{ width: `${w}%` }} ... />)}
  </div>
  // mobile (< sm)
  <div className="block sm:hidden">
    {MOBILE_WIDTHS.map((w, i) => <div key={i} style={{ width: `${w}%` }} ... />)}
  </div>
  ```
- A `0` width entry in the widths array represents an empty/blank line gap

**`NumberFlow` animated counters**
- `NumberFlow` does **not** animate from 0 automatically on first mount
- Pattern: mount with `value={0}`, then update to the real value via `useEffect` + `requestAnimationFrame`:
  ```tsx
  const [display, setDisplay] = useState(0)
  useEffect(() => { requestAnimationFrame(() => setDisplay(realValue)) }, [realValue])
  return <NumberFlow value={display} />
  ```

**tRPC**
- All procedures go in `src/trpc/routers/` — one file per domain, registered in `_app.ts`
- Use `baseProcedure` (from `init.ts`) as the base for all procedures; it injects `ctx.db`
- Server Components call `caller.<router>.<procedure>()` directly (no HTTP round-trip)
- Client Components use `useTRPC()` + TanStack Query hooks
- Prefetch in Server Components via `prefetch(<router>.<procedure>, input)` then wrap the Client Component in `<HydrateClient>`
