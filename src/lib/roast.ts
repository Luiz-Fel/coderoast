export const MAX_ROAST_CHARS = 2000

export const ROAST_MODES = ["brutally_honest", "full_roast"] as const
export type RoastMode = (typeof ROAST_MODES)[number]

export const ISSUE_SEVERITIES = ["critical", "warning", "good"] as const
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number]

export const VERDICTS = ["legendary", "solid", "needs_work", "needs_serious_help"] as const
export type Verdict = (typeof VERDICTS)[number]

export function scoreToVerdict(score: number): Verdict {
  if (score > 9) return "legendary"
  if (score > 7) return "solid"
  if (score >= 4) return "needs_work"
  return "needs_serious_help"
}
