import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
