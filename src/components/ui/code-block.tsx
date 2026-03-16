import { cacheLife } from "next/cache"
import type { ComponentProps } from "react"
import type { BundledLanguage } from "shiki"
import { codeToHtml } from "shiki"
import { twMerge } from "tailwind-merge"
import { CodeBlockHeader } from "./code-block-header"

export type { CodeBlockHeaderProps } from "./code-block-header"

// ── Root ──────────────────────────────────────────────────────────────────────

export type CodeBlockRootProps = ComponentProps<"figure">

function CodeBlockRoot({ className, children, ...props }: CodeBlockRootProps) {
  return (
    <figure
      className={twMerge("overflow-hidden border border-border bg-[#101010]", className)}
      {...props}
    >
      {children}
    </figure>
  )
}

// ── Body ──────────────────────────────────────────────────────────────────────

export type CodeBlockBodyProps = ComponentProps<"div"> & {
  code: string
  lang: BundledLanguage
}

async function CodeBlockBody({ code, lang, className, ...props }: CodeBlockBodyProps) {
  "use cache"
  cacheLife("hourly")

  const html = await codeToHtml(code, { lang, theme: "vesper" })
  const lineNumbers = Array.from({ length: code.split("\n").length }, (_, i) => i + 1)

  return (
    <div className={twMerge("flex overflow-x-auto", className)} {...props}>
      {/* line numbers */}
      <div
        className="flex flex-col gap-1.5 border-border border-r bg-bg-surface px-2.5 py-3 text-right"
        aria-hidden
      >
        {lineNumbers.map((n) => (
          <span key={n} className="block font-mono text-[13px] text-text-tertiary leading-[1.4]">
            {n}
          </span>
        ))}
      </div>

      {/* shiki output */}
      <div
        className="min-w-0 flex-1 [&_pre]:overflow-visible [&_pre]:bg-transparent! [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-[1.4]"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is trusted
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const CodeBlock = {
  Root: CodeBlockRoot,
  Header: CodeBlockHeader,
  Body: CodeBlockBody,
}
