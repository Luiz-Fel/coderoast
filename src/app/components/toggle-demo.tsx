"use client"

import { useState } from "react"
import { Toggle } from "@/components/ui/toggle"

export function ToggleDemo() {
  const [checked, setChecked] = useState(false)
  return <Toggle checked={checked} onCheckedChange={setChecked} label="roast mode" />
}
