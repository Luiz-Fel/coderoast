"use client"

import type { ComponentProps } from "react"
import { useState } from "react"
import { twMerge } from "tailwind-merge"

export type ShareButtonProps = Omit<ComponentProps<"button">, "children">

export function ShareButton({ className, ...props }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={twMerge(
        "border border-border px-4 py-2 font-mono text-text-primary text-xs transition-colors hover:border-brand hover:text-brand",
        className
      )}
      {...props}
    >
      {copied ? "copied!" : "$ share_roast"}
    </button>
  )
}
