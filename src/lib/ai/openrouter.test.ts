import assert from "node:assert/strict"
import test from "node:test"
import {
  buildRoastSystemPrompt,
  extractJsonObject,
  normalizeRoastAnalysis,
} from "@/lib/ai/openrouter"

test("extractJsonObject reads fenced JSON", () => {
  const parsed = extractJsonObject('```json\n{"score":7.2}\n```')
  assert.deepEqual(parsed, { score: 7.2 })
})

test("normalizeRoastAnalysis parses and validates shape", () => {
  const normalized = normalizeRoastAnalysis({
    score: 5.2,
    roastQuote: "not bad, not good.",
    suggestedFix: null,
    language: "typescript",
    issues: [
      {
        severity: "warning",
        title: "redundant boolean comparison",
        description: "compare boolean directly instead of using == true.",
      },
    ],
  })

  assert.equal(normalized.score, 5.2)
  assert.equal(normalized.language, "typescript")
  assert.equal(normalized.issues.length, 1)
})

test("normalizeRoastAnalysis rejects invalid score", () => {
  assert.throws(() =>
    normalizeRoastAnalysis({
      score: 13,
      roastQuote: "broken",
      language: "javascript",
      issues: [
        {
          severity: "critical",
          title: "invalid",
          description: "invalid",
        },
      ],
    })
  )
})

test("buildRoastSystemPrompt changes tone by mode", () => {
  const brutal = buildRoastSystemPrompt("brutally_honest")
  const fullRoast = buildRoastSystemPrompt("full_roast")

  assert.match(brutal, /direct and professional/i)
  assert.match(fullRoast, /sarcastic and witty/i)
})
