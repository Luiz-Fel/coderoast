import type { ComponentProps } from "react"
import type { BundledLanguage } from "shiki"
import { codeToHtml } from "shiki"
import { twMerge } from "tailwind-merge"

export type CodeBlockProps = ComponentProps<"figure"> & {
  code: string
  lang: BundledLanguage
  filename?: string
}

export async function CodeBlock({ code, lang, filename, className, ...props }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  })

  const lines = code.split("\n")

  return (
    <figure
      className={twMerge("overflow-hidden border border-border bg-[#101010]", className)}
      {...props}
    >
      {/* header */}
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <span className="size-2.5 rounded-full bg-[#ef4444]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#f59e0b]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#10b981]" aria-hidden />
        <span className="flex-1" />
        {filename && <span className="font-mono text-xs text-text-tertiary">{filename}</span>}
      </div>

      {/* body */}
      <div className="flex overflow-x-auto">
        {/* line numbers */}
        <div
          className="flex flex-col gap-1.5 border-r border-border bg-bg-surface px-2.5 py-3 text-right"
          aria-hidden
        >
          {lines.map((_, i) => (
            <span
              key={i + 1}
              className="block font-mono text-[13px] leading-[1.4] text-text-tertiary"
            >
              {i + 1}
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
    </figure>
  )
}
