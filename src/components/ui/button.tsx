import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv, type VariantProps } from "tailwind-variants"

const button = tv({
  base: "inline-flex items-center justify-center gap-2 font-medium text-sm py-2.5 px-6",
  variants: {
    variant: {
      primary: [
        "bg-emerald-500 text-zinc-950",
        "hover:bg-emerald-400",
        "focus-visible:ring-emerald-500",
      ],
      secondary: ["bg-zinc-800 text-zinc-50", "hover:bg-zinc-700", "focus-visible:ring-zinc-600"],
      outline: [
        "border border-emerald-500 text-emerald-500 bg-transparent",
        "hover:bg-emerald-500 hover:text-zinc-950",
        "focus-visible:ring-emerald-500",
      ],
      ghost: [
        "bg-transparent text-zinc-300",
        "hover:bg-zinc-800 hover:text-zinc-50",
        "focus-visible:ring-zinc-600",
      ],
      danger: ["bg-red-500 text-zinc-50", "hover:bg-red-400", "focus-visible:ring-red-500"],
    },
    size: {
      sm: "py-1.5 px-4 text-xs",
      md: "py-2.5 px-6 text-sm",
      lg: "py-3.5 px-8 text-base",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    rounded: "none",
  },
})

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>

export function Button({ variant, size, rounded, className, children, ...props }: ButtonProps) {
  return (
    <button className={twMerge(button({ variant, size, rounded }), className)} {...props}>
      {children}
    </button>
  )
}
