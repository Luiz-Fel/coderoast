import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

// ── CodeBlockHeader ───────────────────────────────────────────────────────────

export type CodeBlockHeaderProps = ComponentProps<"div"> & {
  filename?: string
}

export function CodeBlockHeader({ filename, className, children, ...props }: CodeBlockHeaderProps) {
  return (
    <div
      className={twMerge("flex h-10 items-center gap-3 border-b border-border px-4", className)}
      {...props}
    >
      <span className="size-2.5 rounded-full bg-accent-red" aria-hidden />
      <span className="size-2.5 rounded-full bg-accent-amber" aria-hidden />
      <span className="size-2.5 rounded-full bg-accent-green" aria-hidden />
      <span className="flex-1" />
      {filename && <span className="font-mono text-text-tertiary text-xs">{filename}</span>}
      {children}
    </div>
  )
}
