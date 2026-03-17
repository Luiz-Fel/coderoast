"use client"

import type { ComponentProps } from "react"
import { useState } from "react"
import { twMerge } from "tailwind-merge"

type ShareState = "idle" | "shared" | "copied"

const LABEL: Record<ShareState, string> = {
  idle: "$ share_roast",
  shared: "shared!",
  copied: "copied!",
}

export type ShareButtonProps = Omit<ComponentProps<"button">, "children">

export function ShareButton({ className, ...props }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle")

  async function handleClick() {
    const url = window.location.href

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, url })
        setState("shared")
        setTimeout(() => setState("idle"), 2000)
        return
      } catch (err) {
        // AbortError means user dismissed the share sheet — treat as no-op
        if (err instanceof Error && err.name === "AbortError") return
        // Any other error falls through to clipboard fallback below
      }
    }

    await navigator.clipboard.writeText(url)
    setState("copied")
    setTimeout(() => setState("idle"), 2000)
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
      {LABEL[state]}
    </button>
  )
}
