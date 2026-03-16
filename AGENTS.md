# CodeRoast — Agent Guidelines

## What this project is

A web app that receives code, rates it with a score 0–10, and returns brutal/humorous AI feedback. Users can compare their results on a public shame leaderboard.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind v4** (`@theme` tokens in `globals.css`) · **tailwind-variants** (`tv()`) · **tailwind-merge** (`twMerge`)
- **Biome** for lint + format (strict — no `eslint`, no `prettier`)
- **Base UI** for headless primitives · **Shiki** for syntax highlighting

## Project structure

```
src/
  app/
    layout.tsx          # root layout — renders <Header />
    page.tsx            # homepage: hero + leaderboard preview
    components/page.tsx # kitchen sink / component library
  components/
    ui/                 # atomic & composite UI components
      AGENTS.md         # component-level conventions (read this too)
```

## Key conventions

**Components** (`src/components/ui/`)
- One file per component, kebab-case filename, no barrel `index.ts`
- Extend native HTML props via `ComponentProps<"tag">`
- Composite components use **namespace export**: `export const Foo = { Root, Bar, Baz }`
- Always `twMerge(recipe({ ... }), className)` — never template literals for class merging

**Biome gotchas**
- No array index as React key → use `Array.from({ length }, (_, i) => i + 1)`
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
- `CodeBlock.Body` is an async Server Component (uses `codeToHtml`)
- `CodeInputForm` is a Client Component (`"use client"`)
- Default to Server Components; add `"use client"` only when needed
