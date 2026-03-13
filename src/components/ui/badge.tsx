import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv, type VariantProps } from "tailwind-variants"

const badge = tv({
  slots: {
    root: "inline-flex items-center gap-2",
    dot: "size-2 shrink-0 rounded-full",
    label: "font-mono text-xs",
  },
  variants: {
    variant: {
      critical: {
        dot: "bg-accent-red",
        label: "text-accent-red",
      },
      warning: {
        dot: "bg-accent-amber",
        label: "text-accent-amber",
      },
      good: {
        dot: "bg-accent-green",
        label: "text-accent-green",
      },
    },
  },
  defaultVariants: {
    variant: "good",
  },
})

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badge> & {
    label: string
  }

export function Badge({ variant, label, className, ...props }: BadgeProps) {
  const { root, dot, label: labelClass } = badge({ variant })
  return (
    <span className={twMerge(root(), className)} {...props}>
      <span className={dot()} />
      <span className={labelClass()}>{label}</span>
    </span>
  )
}
