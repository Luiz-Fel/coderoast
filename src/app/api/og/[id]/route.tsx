import { ImageResponse } from "@takumi-rs/image-response"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { roasts } from "@/db/schema"

// ── Score colour helper ────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score > 7) return "#10b981" // good / green
  if (score >= 4) return "#f59e0b" // warning / amber
  return "#ef4444" // critical / red
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [roast] = await db
    .select({
      score: roasts.score,
      verdict: roasts.verdict,
      language: roasts.language,
      lineCount: roasts.lineCount,
      roastQuote: roasts.roastQuote,
    })
    .from(roasts)
    .where(eq(roasts.id, id))
    .limit(1)

  if (!roast) {
    return new Response("Not found", { status: 404 })
  }

  const score = Number(roast.score)
  const color = scoreColor(score)
  const lang = roast.language ?? "unknown"

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        padding: 64,
        gap: 28,
        fontFamily: "Geist Mono",
      }}
    >
      {/* ── Logo ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#10b981", fontSize: 24, fontWeight: 700 }}>&gt;</span>
        <span style={{ color: "#fafafa", fontSize: 20, fontWeight: 500 }}>coderoast</span>
      </div>

      {/* ── Score ── */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        <span
          style={{
            color,
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)}
        </span>
        <span
          style={{
            color: "#4b5563",
            fontSize: 56,
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          /10
        </span>
      </div>

      {/* ── Verdict ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 9999,
            backgroundColor: color,
          }}
        />
        <span style={{ color, fontSize: 20, fontWeight: 400 }}>{roast.verdict}</span>
      </div>

      {/* ── Lang info ── */}
      <span style={{ color: "#4b5563", fontSize: 16, fontWeight: 400 }}>
        lang: {lang} · {roast.lineCount} lines
      </span>

      {/* ── Roast quote ── */}
      <span
        style={{
          color: "#fafafa",
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        &ldquo;{roast.roastQuote}&rdquo;
      </span>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
