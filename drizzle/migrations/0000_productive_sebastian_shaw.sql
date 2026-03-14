CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_mode" AS ENUM('brutally_honest', 'full_roast');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('legendary', 'solid', 'needs_work', 'needs_serious_help');--> statement-breakpoint
CREATE TABLE "roast_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_id" uuid NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"code" text NOT NULL,
	"language" varchar(64),
	"line_count" integer NOT NULL,
	"mode" "roast_mode" DEFAULT 'brutally_honest' NOT NULL,
	"score" numeric(4, 2) NOT NULL,
	"verdict" "verdict" NOT NULL,
	"roast_quote" text NOT NULL,
	"suggested_fix" text
);
--> statement-breakpoint
ALTER TABLE "roast_issues" ADD CONSTRAINT "roast_issues_roast_id_roasts_id_fk" FOREIGN KEY ("roast_id") REFERENCES "public"."roasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roasts_score_idx" ON "roasts" USING btree ("score");