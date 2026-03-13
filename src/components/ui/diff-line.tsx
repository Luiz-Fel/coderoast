import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv, type VariantProps } from "tailwind-variants"

const diffLine = tv({
  slots: {
    root: "flex gap-2 px-4 py-2",
    prefix: "shrink-0 font-mono text-sm select-none",
    code: "font-mono text-sm",
  },
  variants: {
    type: {
      added: {
        root: "bg-[#0a1a0f]",
        prefix: "text-accent-green",
        code: "text-text-primary",
      },
      removed: {
        root: "bg-[#1a0a0a]",
        prefix: "text-accent-red",
        code: "text-text-secondary",
      },
      context: {
        root: "bg-transparent",
        prefix: "text-text-tertiary",
        code: "text-text-secondary",
      },
    },
  },
  defaultVariants: {
    type: "context",
  },
})

const PREFIXES = {
  added: "+",
  removed: "-",
  context: " ",
} as const

export type DiffLineProps = ComponentProps<"div"> &
  VariantProps<typeof diffLine> & {
    code: string
  }

export function DiffLine({ type, code, className, ...props }: DiffLineProps) {
  const { root, prefix, code: codeClass } = diffLine({ type })
  return (
    <div className={twMerge(root(), className)} {...props}>
      <span className={prefix()} aria-hidden>
        {PREFIXES[type ?? "context"]}
      </span>
      <span className={codeClass()}>{code}</span>
    </div>
  )
}
