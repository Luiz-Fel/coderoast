# tRPC — Especificação de Implementação

## Contexto

A camada de dados atual usa Server Actions avulsas em `src/app/actions/`. O objetivo é centralizar toda comunicação cliente-servidor no tRPC v11 com TanStack React Query, aproveitando o App Router do Next.js para prefetch de queries em Server Components e consumo reativo em Client Components.

O projeto já usa Drizzle para persistência; o tRPC será a camada intermediária entre as páginas e o banco.

---

## Stack

| Camada | Escolha |
|---|---|
| Framework | tRPC v11 (`@trpc/server`, `@trpc/client`) |
| Integração React | `@trpc/tanstack-react-query` + `@tanstack/react-query` |
| Validação | `zod` (já usado no schema Drizzle) |
| Boundary SSR/client | `server-only` / `client-only` |

---

## Arquitetura

### Fluxo Server Component → Client Component

```
Server Component (async)
  └─ prefetch(trpc.roasts.list.queryOptions())   ← trpc/server.ts
       └─ HydrateClient                           ← wrapper de dehydrate
            └─ <ClientComponent>
                 └─ useQuery(trpc.roasts.list.queryOptions())  ← useTRPC()
```

O prefetch dispara a query no servidor e a hidrata no client sem refetch. O componente client usa `useQuery` (ou `useSuspenseQuery`) com os mesmos `queryOptions` — as keys baterão e a cache será reutilizada.

### Para dados somente server (sem hidratação)

```ts
const data = await caller.roasts.list()   // trpc/server.ts — não vai para o cache client
```

---

## Estrutura de arquivos

```
src/
  trpc/
    init.ts            ← initTRPC, createTRPCContext, baseProcedure
    query-client.ts    ← makeQueryClient (staleTime + dehydrate config)
    client.tsx         ← "use client" — TRPCReactProvider, useTRPC, TRPCProvider
    server.ts          ← server-only — trpc proxy, getQueryClient, HydrateClient, prefetch, caller
    routers/
      _app.ts          ← appRouter (combina sub-routers), exporta AppRouter type
      roasts.ts        ← procedimentos de roast (list, getById, create)

  app/
    api/
      trpc/
        [trpc]/
          route.ts     ← fetch adapter (GET + POST /api/trpc/*)
    layout.tsx         ← adiciona <TRPCReactProvider> wrapping children
```

Arquivos a remover após migração:
- `src/app/actions/` — substituídos pelos procedimentos tRPC

---

## Implementação

### `src/trpc/init.ts`

```ts
import { initTRPC } from "@trpc/server"
import { cache } from "react"
import { db } from "@/db"

export const createTRPCContext = cache(async () => {
  return { db }
})

const t = initTRPC.context<typeof createTRPCContext>().create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
```

O contexto injeta `db` (instância Drizzle) em todos os procedimentos — sem precisar importar diretamente nos routers.

### `src/trpc/query-client.ts`

```ts
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  })
}
```

`shouldDehydrateQuery` estendido para incluir queries `pending` — necessário para streaming de promises RSC.

### `src/trpc/client.tsx`

```ts
"use client"

import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import { useState } from "react"
import { makeQueryClient } from "./query-client"
import type { AppRouter } from "./routers/_app"

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  const base =
    typeof window !== "undefined"
      ? ""
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"
  return `${base}/api/trpc`
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

### `src/trpc/server.ts`

```ts
import "server-only"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query"
import { cache } from "react"
import { createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export const caller = appRouter.createCaller(createTRPCContext)

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(queryOptions)
}
```

`getQueryClient` usa `cache()` do React para retornar o mesmo `QueryClient` por request, garantindo que prefetch e dehydrate compartilhem a mesma instância.

### `src/trpc/routers/_app.ts`

```ts
import { createTRPCRouter } from "../init"
import { roastsRouter } from "./roasts"

export const appRouter = createTRPCRouter({
  roasts: roastsRouter,
})

export type AppRouter = typeof appRouter
```

### `src/trpc/routers/roasts.ts` (estrutura inicial)

```ts
import { z } from "zod"
import { baseProcedure, createTRPCRouter } from "../init"
import { desc, eq } from "drizzle-orm"
import { roasts, roastIssues } from "@/db/schema"

export const roastsRouter = createTRPCRouter({
  list: baseProcedure.query(async ({ ctx }) => {
    return ctx.db.query.roasts.findMany({
      orderBy: [desc(roasts.createdAt)],
      limit: 50,
    })
  }),

  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.roasts.findFirst({
        where: eq(roasts.id, input.id),
        with: { issues: { orderBy: [roastIssues.sortOrder] } },
      })
    }),

  create: baseProcedure
    .input(z.object({
      code: z.string().min(1),
      language: z.string().optional(),
      mode: z.enum(["brutally_honest", "full_roast"]).default("brutally_honest"),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. chamar IA → score, verdict, roastQuote, issues, suggestedFix
      // 2. inserir em roasts + roast_issues
      // 3. retornar { id }
    }),
})
```

### `src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createTRPCContext } from "@/trpc/init"
import { appRouter } from "@/trpc/routers/_app"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

### `src/app/layout.tsx` — adicionar provider

```tsx
import { TRPCReactProvider } from "@/trpc/client"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  )
}
```

---

## Padrões de uso

### Prefetch em Server Component + consumo em Client Component

```tsx
// app/page.tsx (Server Component)
import { prefetch, trpc, HydrateClient } from "@/trpc/server"

export default async function Page() {
  prefetch(trpc.roasts.list.queryOptions())
  return (
    <HydrateClient>
      <LeaderboardClient />
    </HydrateClient>
  )
}
```

```tsx
// components/leaderboard-client.tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function LeaderboardClient() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.roasts.list.queryOptions())
  // ...
}
```

### Dado somente server (sem hidratação)

```tsx
// app/roast/[id]/page.tsx
import { caller } from "@/trpc/server"

export default async function RoastPage({ params }) {
  const roast = await caller.roasts.getById({ id: params.id })
  return <RoastDetail roast={roast} />
}
```

### Mutation em Client Component

```tsx
"use client"
import { useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function SubmitForm() {
  const trpc = useTRPC()
  const submit = useMutation(trpc.roasts.create.mutationOptions())
  // submit.mutate({ code, mode })
}
```

---

## To-dos de implementação

### Fase 1 — Infraestrutura

- [ ] Instalar dependências: `@trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only`
- [ ] Criar `src/trpc/init.ts` — contexto com `db`, `baseProcedure`, helpers
- [ ] Criar `src/trpc/query-client.ts` — `makeQueryClient` com staleTime e dehydrate config
- [ ] Criar `src/trpc/client.tsx` — `TRPCReactProvider`, `useTRPC`, `TRPCProvider`
- [ ] Criar `src/trpc/server.ts` — `trpc` proxy, `getQueryClient`, `HydrateClient`, `prefetch`, `caller`

### Fase 2 — Router e API route

- [ ] Criar `src/trpc/routers/roasts.ts` com procedimentos `list`, `getById`, `create` (stub)
- [ ] Criar `src/trpc/routers/_app.ts` combinando sub-routers e exportando `AppRouter`
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` com fetch adapter

### Fase 3 — Integração no layout

- [ ] Adicionar `<TRPCReactProvider>` em `src/app/layout.tsx` envolvendo `children`

### Fase 4 — Migração das pages

- [ ] Migrar `src/app/page.tsx`: substituir `MOCK_LEADERBOARD` por `prefetch(trpc.roasts.list.queryOptions())` + `HydrateClient`
- [ ] Migrar página `/roast/[id]`: substituir mock por `caller.roasts.getById({ id })`
- [ ] Implementar lógica real em `roasts.create` (IA + persistência)
- [ ] Remover `src/app/actions/` após migração completa

### Fase 5 — Qualidade

- [ ] Verificar que `src/trpc/server.ts` não é importável no client (`server-only` bloqueia)
- [ ] `pnpm build` sem erros de tipo
- [ ] Testar prefetch + hidratação: query não dispara segundo fetch no client (Network tab)

---

## Notas de design

- `zod` já é dependência via Drizzle (`drizzle-zod`) — não precisa instalar separado.
- `httpBatchLink` agrupa múltiplas queries em um único request HTTP. Para o leaderboard + contadores da homepage, isso evita waterfalls.
- O `caller` (server-side direct call) não passa pelo HTTP adapter — é chamada direta ao router, ideal para páginas de detalhe onde os dados não precisam ser reativos no client.
- Não usar `superjson` nesta fase — o schema Drizzle retorna tipos serializáveis (strings, numbers, Date). Se `Date` causar problemas na hidratação, adicionar `superjson` como transformer.
- Sub-routers futuros (`ai`, `stats`) seguem o mesmo padrão: criar `src/trpc/routers/nome.ts` e registrar em `_app.ts`.
