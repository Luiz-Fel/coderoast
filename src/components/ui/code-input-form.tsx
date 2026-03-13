"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"

const MOCK_CODE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion
  return total
}`

export function CodeInputForm() {
  const router = useRouter()
  const [code, setCode] = useState(MOCK_CODE)
  const [roastMode, setRoastMode] = useState(false)

  const lineCount = code.split("\n").length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  function handleSubmit() {
    router.push("/roast")
  }

  return (
    <div className="flex w-full max-w-[780px] flex-col gap-4">
      {/* editor */}
      <div className="overflow-hidden border border-border bg-[#101010]">
        {/* window header */}
        <div className="flex h-10 items-center gap-3 border-border border-b px-4">
          <span className="size-2.5 rounded-full bg-accent-red" aria-hidden />
          <span className="size-2.5 rounded-full bg-accent-amber" aria-hidden />
          <span className="size-2.5 rounded-full bg-accent-green" aria-hidden />
        </div>

        {/* editor body */}
        <div className="flex" style={{ height: 320 }}>
          {/* line numbers */}
          <div
            className="flex flex-col gap-0 border-border border-r bg-bg-surface px-3 py-3 text-right"
            aria-hidden
          >
            {lineNumbers.map((n) => (
              <span
                key={n}
                className="block font-mono text-[13px] text-text-tertiary leading-[1.6]"
              >
                {n}
              </span>
            ))}
          </div>

          {/* textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className={[
              "min-w-0 flex-1 resize-none bg-transparent px-4 py-3",
              "font-mono text-[13px] text-text-primary leading-[1.6]",
              "outline-none placeholder:text-text-tertiary",
            ].join(" ")}
            placeholder="// paste your code here..."
            aria-label="Code input"
          />
        </div>
      </div>

      {/* actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle checked={roastMode} onCheckedChange={setRoastMode} label="roast mode" />
          <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-text-tertiary text-xs">
            {"// maximum sarcasm enabled"}
          </span>
        </div>

        <Button variant="primary" onClick={handleSubmit}>
          $ roast_my_code
        </Button>
      </div>
    </div>
  )
}
