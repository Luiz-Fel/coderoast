import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { Badge, type BadgeProps } from "@/components/ui/badge"

// ── Root ──────────────────────────────────────────────────────────────────────

export type AnalysisCardRootProps = ComponentProps<"article">

function AnalysisCardRoot({ className, children, ...props }: AnalysisCardRootProps) {
  return (
    <article
      className={twMerge("flex flex-col gap-3 border border-border p-5", className)}
      {...props}
    >
      {children}
    </article>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export type AnalysisCardBadgeProps = Pick<BadgeProps, "variant" | "className"> & {
  label?: string
}

function AnalysisCardBadge({ variant, label, className }: AnalysisCardBadgeProps) {
  return (
    <Badge variant={variant} label={label ?? (variant as string) ?? "good"} className={className} />
  )
}

// ── Title ─────────────────────────────────────────────────────────────────────

export type AnalysisCardTitleProps = ComponentProps<"p">

function AnalysisCardTitle({ className, children, ...props }: AnalysisCardTitleProps) {
  return (
    <p className={twMerge("font-mono text-sm text-text-primary", className)} {...props}>
      {children}
    </p>
  )
}

// ── Description ───────────────────────────────────────────────────────────────

export type AnalysisCardDescriptionProps = ComponentProps<"p">

function AnalysisCardDescription({ className, children, ...props }: AnalysisCardDescriptionProps) {
  return (
    <p
      className={twMerge(
        "font-['IBM_Plex_Mono',ui-monospace,monospace] text-xs leading-normal text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const AnalysisCard = {
  Root: AnalysisCardRoot,
  Badge: AnalysisCardBadge,
  Title: AnalysisCardTitle,
  Description: AnalysisCardDescription,
}
