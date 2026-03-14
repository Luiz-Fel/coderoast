# UI Components — Padrões de criação

Este documento descreve as convenções que todo componente em `src/components/ui/` deve seguir.

## Estrutura de um componente

Cada componente vive em seu próprio arquivo com o nome em kebab-case:

```
src/components/ui/
  button.tsx
  input.tsx
  badge.tsx
  ...
```

Um arquivo por componente. Sem barrel `index.ts` — importe diretamente do arquivo.

```ts
// correto
import { Button } from "@/components/ui/button"

// evitar
import { Button } from "@/components/ui"
```

## Assinatura padrão

Todo componente deve:

1. Estender as props nativas do elemento HTML correspondente via `ComponentProps<"tag">`
2. Adicionar as variantes via `VariantProps<typeof recipe>`
3. Exportar o tipo de props com named export
4. Exportar o componente com named export (nunca `export default`)

```tsx
import type { ComponentProps } from "react"
import { twMerge } from "tailwind-merge"
import { tv, type VariantProps } from "tailwind-variants"

const component = tv({ ... })

export type ComponentNameProps = ComponentProps<"tag"> & VariantProps<typeof component>

export function ComponentName({ variant, size, className, children, ...props }: ComponentNameProps) {
  return (
    <tag className={twMerge(component({ variant, size }), className)} {...props}>
      {children}
    </tag>
  )
}
```

## Variantes com `tailwind-variants`

Use `tv()` para definir variantes. A recipe fica fora do componente (escopo de módulo), nunca dentro da função.

```tsx
const component = tv({
  // base: estilos presentes em todas as variantes
  base: "inline-flex items-center ...",

  variants: {
    // cada eixo de variação é uma chave
    variant: {
      primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
      secondary: "bg-zinc-800 text-zinc-50 hover:bg-zinc-700",
    },
    size: {
      sm: "py-1.5 px-4 text-xs",
      md: "py-2.5 px-6 text-sm",
      lg: "py-3.5 px-8 text-base",
    },
  },

  // valores usados quando a prop não é passada
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})
```

Agrupe as classes de um mesmo estado/responsabilidade em arrays quando facilitar a leitura:

```tsx
// preferível quando há muitas classes correlatas
primary: [
  "bg-emerald-500 text-zinc-950",
  "hover:bg-emerald-400",
  "focus-visible:ring-emerald-500",
],

// aceitável quando são poucas classes
secondary: ["bg-zinc-800 text-zinc-50", "hover:bg-zinc-700", "focus-visible:ring-zinc-600"],
```

## Merge de classes com `tailwind-merge`

Use `twMerge()` para combinar a recipe com o `className` externo. Isso garante que classes passadas pelo consumidor sobrescrevam as da recipe sem conflitos.

```tsx
<tag className={twMerge(component({ variant, size }), className)} />
```

Nunca concatene com template literal ou `clsx` sem `twMerge` — isso causa classes duplicadas e comportamento imprevisível no Tailwind.

## Tokens de design (`@theme`)

Os tokens do projeto estão declarados no bloco `@theme` em `src/app/globals.css` e ficam disponíveis automaticamente como classes Tailwind (ex: `bg-brand`, `text-text-primary`, `border-border`).

### Referência rápida

| Grupo | Token CSS | Valor | Classe Tailwind |
|---|---|---|---|
| **Accent** | `--color-brand` | `#10b981` | `bg-brand` / `text-brand` |
| | `--color-accent-red` | `#ef4444` | `bg-accent-red` |
| | `--color-accent-amber` | `#f59e0b` | `bg-accent-amber` |
| | `--color-accent-cyan` | `#06b6d4` | `bg-accent-cyan` |
| **Backgrounds** | `--color-bg` | `#0a0a0a` | `bg-bg` |
| | `--color-bg-surface` | `#0f0f0f` | `bg-bg-surface` |
| | `--color-bg-elevated` | `#1a1a1a` | `bg-bg-elevated` |
| **Borders** | `--color-border` | `#2a2a2a` | `border-border` |
| | `--color-border-focus` | `#10b981` | `border-border-focus` |
| **Text** | `--color-text-primary` | `#fafafa` | `text-text-primary` |
| | `--color-text-secondary` | `#6b7280` | `text-text-secondary` |
| | `--color-text-tertiary` | `#4b5563` | `text-text-tertiary` |
| | `--color-text-muted` | `#a0a0a0` | `text-text-muted` |
| **Severity** | `--color-critical` | `#ef4444` | `text-critical` / `bg-critical` |
| | `--color-warning` | `#f59e0b` | `text-warning` |
| | `--color-good` | `#10b981` | `text-good` |
| **Typography** | `--font-mono` | `JetBrains Mono` | `font-mono` |
| | `--font-mono-alt` | `IBM Plex Mono` | `font-mono-alt` |
| **Spacing** | `--spacing-xs` | `4px` | `gap-xs` / `p-xs` / `m-xs` |
| | `--spacing-sm` | `8px` | `gap-sm` / `p-sm` |
| | `--spacing-md` | `16px` | `gap-md` / `p-md` |
| | `--spacing-lg` | `24px` | `gap-lg` / `p-lg` |
| | `--spacing-xl` | `40px` | `gap-xl` / `p-xl` |

### Regra de uso

Prefira sempre os tokens do projeto em vez de valores hardcoded ou classes Tailwind genéricas:

```tsx
// correto — usa tokens do projeto
<div className="bg-bg border border-border text-text-primary p-md" />

// evitar — hardcoded, fora do sistema
<div className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] p-4" />

// evitar — classe Tailwind genérica sem correspondência no sistema
<div className="bg-zinc-950 text-zinc-50 p-4" />
```

## O que vai em `globals.css` vs. no componente

### `globals.css` — estilos que se repetem em múltiplos componentes

- Declaração dos tokens de design no bloco `@theme`
- Fonte base (`font-family` no `html`)
- `cursor: pointer` e `transition` em elementos interativos (`button`, `a`, `[role="button"]`)
- Estilo padrão de `:focus-visible` (usa `--color-border-focus`)
- Estado `:disabled` / `[aria-disabled]`

### Componente — estilos específicos da identidade visual

- Cores de fundo, texto e borda por variante (usando tokens do projeto)
- Estados `hover:` e `focus-visible:ring-*` por variante
- Padding, tamanho de texto e arredondamento
- Layout interno (`flex`, `gap`, `items-center`)

Antes de adicionar uma classe ao componente, pergunte: *"isso se repetiria em outros componentes?"*. Se sim, considere promover para `globals.css`.

## Acessibilidade

- Prefira o elemento HTML semântico correto (`button` para ações, `a` para navegação)
- O `:focus-visible` já está configurado globalmente — não remova `outline` sem substituir
- Estados `:disabled` e `aria-disabled` já têm `pointer-events: none` e `opacity` via global
- Use `aria-*` props livremente — elas passam via `...props` pelo spread das props nativas
