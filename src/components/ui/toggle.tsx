"use client"

import { Switch } from "@base-ui/react"
import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

export type ToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  name?: ComponentProps<typeof Switch.Root>["name"]
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  name,
}: ToggleProps) {
  return (
    <div className={twMerge("inline-flex cursor-pointer items-center gap-3", className)}>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        name={name}
        className={[
          "relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full p-0.75",
          "border-0 bg-border outline-none transition-colors duration-150",
          "data-checked:bg-accent-green",
          "focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        <Switch.Thumb
          className={[
            "block size-4 rounded-full transition-transform duration-150",
            "bg-text-secondary",
            "data-checked:translate-x-4.5 data-checked:bg-bg",
          ].join(" ")}
        />
      </Switch.Root>
      {label && (
        <span
          className={[
            "font-mono text-xs transition-colors duration-150",
            checked ? "text-accent-green" : "text-text-secondary",
            disabled ? "opacity-50" : "",
          ].join(" ")}
        >
          {label}
        </span>
      )}
    </div>
  )
}
