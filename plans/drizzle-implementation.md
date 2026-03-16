# Drizzle ORM — Especificação de Implementação

## Contexto

O CodeRoast recebe snippets de código, envia para um modelo de IA que retorna uma pontuação (0–10), um veredicto, um texto de roast, análise de issues por categoria e um diff de melhoria. Cada roast é público e aparece no leaderboard — ordenado pela menor pontuação.

Os dados atualmente são todos mock. Este documento especifica o schema do banco, os enums necessários e os passos de implementação do Drizzle ORM com PostgreSQL via Docker Compose.

---

## Stack de banco

| Camada | Escolha |
|---|---|
| ORM | `drizzle-orm` |
| Driver | `postgres` (node-postgres nativo via `drizzle-orm/postgres-js`) |
| Banco | PostgreSQL 16 |
| Infra local | Docker Compose |
| Migrations | `drizzle-kit` |
| Seed | script TypeScript via `tsx` |

---

## Docker Compose

Arquivo: `docker-compose.yml` na raiz do projeto.

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: coderoast
      POSTGRES_PASSWORD: coderoast
      POSTGRES_DB: coderoast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Variável de ambiente esperada em `.env.local`:

```
DATABASE_URL=postgres://coderoast:coderoast@localhost:5432/coderoast
```

---

## Enums

### `roast_mode`

Modo de operação escolhido pelo usuário no formulário.

```ts
export const roastModeEnum = pgEnum("roast_mode", [
  "brutally_honest", // feedback direto e técnico
  "full_roast",      // máximo de sarcasmo
])
```

### `verdict`

Veredicto calculado pela IA com base na pontuação.

```ts
export const verdictEnum = pgEnum("verdict", [
  "legendary",          // > 9
  "solid",              // 7–9
  "needs_work",         // 4–7
  "needs_serious_help", // < 4
])
```

Mapeamento de score → verdict (lógica de negócio, não no banco):

| Score | Verdict |
|---|---|
| > 9 | `legendary` |
| > 7 | `solid` |
| >= 4 | `needs_work` |
| < 4 | `needs_serious_help` |

### `issue_severity`

Severidade de cada issue individual retornada pela análise da IA.

```ts
export const issueSeverityEnum = pgEnum("issue_severity", [
  "critical", // bug ou risco grave (vermelho)
  "warning",  // má prática (âmbar)
  "good",     // ponto positivo (verde)
])
```

---

## Schema de tabelas

### `roasts`

Tabela principal. Cada linha representa um roast completo submetido e processado.

```ts
export const roasts = pgTable("roasts", {
  id:         uuid("id").defaultRandom().primaryKey(),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  // código submetido
  code:       text("code").notNull(),
  language:   varchar("language", { length: 64 }), // ex: "javascript", "python", "sql"
  lineCount:  integer("line_count").notNull(),

  // configuração do roast
  mode:       roastModeEnum("mode").default("brutally_honest").notNull(),

  // resultado da IA
  score:        numeric("score", { precision: 4, scale: 2 }).notNull(), // ex: 3.50
  verdict:      verdictEnum("verdict").notNull(),
  roastQuote:   text("roast_quote").notNull(),    // frase de abertura do roast ("this code...")
  suggestedFix: text("suggested_fix"),            // diff de melhoria em formato unificado (patch text)
})
```

**Índices:**
- `score ASC` — ordenação do leaderboard (pior score no topo)
- `created_at DESC` — listagem cronológica inversa

### `roast_issues`

Issues individuais de análise, retornadas pela IA para cada roast. Relação 1-N com `roasts`.

```ts
export const roastIssues = pgTable("roast_issues", {
  id:          uuid("id").defaultRandom().primaryKey(),
  roastId:     uuid("roast_id").notNull().references(() => roasts.id, { onDelete: "cascade" }),
  severity:    issueSeverityEnum("severity").notNull(),
  title:       varchar("title", { length: 256 }).notNull(), // ex: "using var instead of const/let"
  description: text("description").notNull(),               // explicação da issue
  sortOrder:   integer("sort_order").notNull().default(0),  // ordem de exibição na tela
})
```

**Índices:**
- `(roast_id, sort_order)` — query de issues por roast, na ordem correta

---

## Relações Drizzle

```ts
export const roastsRelations = relations(roasts, ({ many }) => ({
  issues: many(roastIssues),
}))

export const roastIssuesRelations = relations(roastIssues, ({ one }) => ({
  roast: one(roasts, {
    fields: [roastIssues.roastId],
    references: [roasts.id],
  }),
}))
```

---

## Estrutura de arquivos

```
src/
  db/
    index.ts        # instância do cliente Drizzle (singleton)
    schema.ts       # enums + tabelas + relações
    seed.ts         # dados de exemplo para desenvolvimento

drizzle/
  migrations/       # arquivos gerados pelo drizzle-kit
  drizzle.config.ts # configuração do drizzle-kit
```

---

## To-dos de implementação

### 1. Infraestrutura

- [ ] Criar `docker-compose.yml` na raiz
- [ ] Adicionar `.env.local` com `DATABASE_URL` (já no `.gitignore`)
- [ ] Adicionar `.env.example` com `DATABASE_URL=` sem valor
- [ ] Instalar dependências: `drizzle-orm postgres`, dev: `drizzle-kit tsx`

### 2. Schema e migrations

- [ ] Criar `src/db/schema.ts` com enums, tabelas e relações conforme especificado acima
- [ ] Criar `drizzle.config.ts` apontando para `src/db/schema.ts` e `drizzle/migrations/`
- [ ] Rodar `pnpm drizzle-kit generate` para gerar a primeira migration
- [ ] Rodar `pnpm drizzle-kit migrate` para aplicar no banco local

### 3. Cliente Drizzle

- [ ] Criar `src/db/index.ts` com singleton do cliente:
  ```ts
  import { drizzle } from "drizzle-orm/postgres-js"
  import postgres from "postgres"
  import * as schema from "./schema"

  const client = postgres(process.env.DATABASE_URL!)
  export const db = drizzle(client, { schema })
  ```

### 4. Server Actions / API

- [ ] Criar `src/app/actions/submit-roast.ts` — Server Action que:
  1. Recebe `code` e `mode` do formulário
  2. Chama a API da IA (OpenAI / Anthropic / etc.)
  3. Persiste o roast e issues no banco via Drizzle
  4. Redireciona para `/roast/[id]`
- [ ] Criar `src/app/actions/get-leaderboard.ts` — query de roasts ordenados por `score ASC`
- [ ] Criar `src/app/actions/get-roast.ts` — query de um roast por `id` com `issues` incluídas

### 5. Substituição de mocks

- [ ] Substituir `MOCK_LEADERBOARD` em `src/app/page.tsx` pela query real
- [ ] Substituir dados mock da página `/roast` pela query real usando o `id` da URL
- [ ] Substituir contadores mock ("2,847 codes roasted", "avg score: 4.2/10") por queries `count` e `avg` no banco

### 6. Seed

- [ ] Criar `src/db/seed.ts` com ~10 roasts de exemplo (incluindo os 3 atuais do mock)
- [ ] Adicionar script `"db:seed": "tsx src/db/seed.ts"` no `package.json`

### 7. Scripts utilitários no `package.json`

```json
"db:up":       "docker compose up -d",
"db:down":     "docker compose down",
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:seed":     "tsx src/db/seed.ts"
```

---

## Notas de design

- `score` usa `numeric(4,2)` em vez de `float` para evitar imprecisão em comparações e exibição.
- `language` é `varchar` livre — não enum — pois os valores vêm da detecção automática da IA e podem variar (ex: `"javascript"`, `"TypeScript"`, `"sql"`, `"python"`, `"bash"`).
- `suggested_fix` armazena o diff completo como texto puro (formato unified diff / patch). O componente `DiffLine` já sabe renderizá-lo linha a linha.
- Não há tabela de usuários nesta fase — o leaderboard é completamente anônimo, conforme o design.
- Cascade delete em `roast_issues` garante que remover um roast limpa suas issues automaticamente.
