import type { ComponentProps } from "react"
import type { BundledLanguage } from "shiki"
import { codeToHtml } from "shiki"
import { twMerge } from "tailwind-merge"

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

// ── Header ────────────────────────────────────────────────────────────────────

export type CodeBlockHeaderProps = ComponentProps<"div"> & {
  filename?: string
}

function CodeBlockHeader({ filename, className, children, ...props }: CodeBlockHeaderProps) {
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

// ── Body ──────────────────────────────────────────────────────────────────────

export type CodeBlockBodyProps = ComponentProps<"div"> & {
  code: string
  lang: BundledLanguage
}

async function CodeBlockBody({ code, lang, className, ...props }: CodeBlockBodyProps) {
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
          <span key={n} className="block font-mono text-[13px] leading-[1.4] text-text-tertiary">
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
