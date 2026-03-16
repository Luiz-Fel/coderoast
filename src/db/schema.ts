import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

// ── Enums ─────────────────────────────────────────────────────────────────────

export const roastModeEnum = pgEnum("roast_mode", ["brutally_honest", "full_roast"])

export const verdictEnum = pgEnum("verdict", [
  "legendary",
  "solid",
  "needs_work",
  "needs_serious_help",
])

export const issueSeverityEnum = pgEnum("issue_severity", ["critical", "warning", "good"])

// ── Tables ────────────────────────────────────────────────────────────────────

export const roasts = pgTable(
  "roasts",
  {
    id: uuid().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),

    // submitted code
    code: text().notNull(),
    language: varchar({ length: 64 }),
    lineCount: integer().notNull(),

    // roast config
    mode: roastModeEnum().default("brutally_honest").notNull(),

    // AI result
    score: numeric({ precision: 4, scale: 2 }).notNull(),
    verdict: verdictEnum().notNull(),
    roastQuote: text().notNull(),
    suggestedFix: text(),
  },
  (t) => [
    // leaderboard ordering — worst score first
    index("roasts_score_idx").on(t.score),
  ]
)

export const roastIssues = pgTable("roast_issues", {
  id: uuid().defaultRandom().primaryKey(),
  roastId: uuid()
    .notNull()
    .references(() => roasts.id, { onDelete: "cascade" }),
  severity: issueSeverityEnum().notNull(),
  title: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  sortOrder: integer().notNull().default(0),
})

export const roastRateLimits = pgTable(
  "roast_rate_limits",
  {
    id: uuid().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    key: varchar({ length: 128 }).notNull(),
    windowStart: timestamp({ withTimezone: true }).notNull(),
    count: integer().notNull().default(1),
  },
  (t) => [uniqueIndex("roast_rate_limits_key_window_idx").on(t.key, t.windowStart)]
)
