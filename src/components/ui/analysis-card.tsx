import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { Badge, type BadgeProps } from "@/components/ui/badge"

export type AnalysisCardProps = ComponentProps<"article"> & {
  variant: BadgeProps["variant"]
  title: string
  description: string
}

export function AnalysisCard({
  variant,
  title,
  description,
  className,
  ...props
}: AnalysisCardProps) {
  return (
    <article
      className={twMerge("flex flex-col gap-3 border border-border p-5", className)}
      {...props}
    >
      <Badge variant={variant} label={variant ?? "good"} />
      <p className="font-mono text-sm text-text-primary">{title}</p>
      <p className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-xs leading-normal text-text-secondary">
        {description}
      </p>
    </article>
  )
}
