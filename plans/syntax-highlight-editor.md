# Syntax Highlight Editor — Research & Specification

## Contexto

O `CodeInputForm` atual é um `<textarea>` simples. O objetivo é transformá-lo em um editor com syntax highlighting em tempo real, com detecção automática de linguagem ao colar código, e a opção do usuário selecionar a linguagem manualmente.

---

## 1. Análise do ray.so

O ray.so usa a abordagem **textarea + overlay**, que é o padrão mais adotado em ferramentas de code-snippet:

### Como funciona

- `Editor.tsx` renderiza um `<textarea>` invisível (mas funcional) **sobreposto** a um `<div>` com o HTML colorido gerado pelo Shiki
- `HighlightedCode.tsx` é o overlay — recebe `code` e `selectedLanguage`, chama `highlighter.codeToHtml(...)` de forma assíncrona e injeta via `dangerouslySetInnerHTML`
- O highlighter é criado **uma vez** e compartilhado via estado global (Jotai atom), carregando gramáticas sob demanda (`highlighter.loadLanguage(selectedLanguage.src)`)
- Para detecção automática de linguagem, ray.so usa **`highlight.js` com `hljs.highlightAuto()`** — não o Shiki, que não possui essa capacidade nativa

### Trecho chave do `store/code.ts` do ray.so

```ts
import hljs from "highlight.js";

const detectLanguage = async (input: string): Promise<string> => {
  return new Promise((resolve) => {
    const highlightResult = hljs.highlightAuto(input, Object.keys(LANGUAGES));
    if (highlightResult.language) {
      resolve(highlightResult.language);
    } else {
      resolve(LANGUAGES.plaintext.name.toLowerCase());
    }
  });
};
```

A detecção roda toda vez que o código muda (`codeAtom` setter), atualizando um `detectedLanguageAtom`. O `selectedLanguageAtom` é derivado: se o usuário não escolheu manualmente (`userInputtedLanguageAtom === null`), usa o detectado.

---

## 2. Opções Avaliadas

### 2.1 Abordagem Textarea + Overlay (ray.so style) — RECOMENDADA

**Como funciona:** `<textarea>` transparente em cima de um `<div>` com o HTML colorido. O textarea captura input; o div exibe o highlight.

**Prós:**
- Sem dependências pesadas de editor completo
- Consistente com o visual que já temos (já usamos essa estrutura no `CodeInputForm`)
- Shiki já está no projeto, apenas precisa ser usado no client também
- Leve: nenhuma nova lib de editor
- Controle total sobre o CSS/layout
- Mesmo padrão do ray.so

**Contras:**
- Sincronização scroll entre textarea e overlay precisa de atenção
- Sem autocomplete, bracket matching, etc. (mas não é necessário para um roaster)

**Libs necessárias:**
- `shiki` (já presente) — para o highlighting
- `highlight.js` (nova) — apenas para detecção de linguagem (`highlightAuto`)
- OU `@wooorm/franc` / `linguist-languages` como alternativa mais leve para detecção

### 2.2 CodeMirror 6

**Como funciona:** Editor completo com extensões modulares. Tem suporte a syntax highlight via `@codemirror/language` e `@codemirror/lang-*`.

**Prós:**
- Editor rico (bracket matching, autocomplete, etc.)
- Ótima performance para documentos grandes
- Tree-sitter based (preciso)

**Contras:**
- Bundle pesado (~150KB+ gzipped)
- Visual precisa ser customizado para combinar com o design atual
- Overkill para um campo de paste + roast
- Não usa Shiki (tema vesper seria perdido)

### 2.3 Monaco Editor (VS Code)

**Como funciona:** O editor do VS Code como lib.

**Prós:**
- Feature-complete
- Linguagem detection integrada

**Contras:**
- Bundle enorme (~2MB)
- Difícil de estilizar para combinar com o design minimalista atual
- Requer configs especiais no Next.js (workers, dynamic import)
- Completamente overkill

### 2.4 `react-shiki` (avgvstvs96/react-shiki)

**Como funciona:** Hook/componente React que roda Shiki no client para highlighting em tempo real.

**Prós:**
- Shiki no client com React hooks
- Bundling otimizado (lazy load de gramáticas)

**Contras:**
- Lib terceira (~45 snippets de docs, menor ecosistema)
- Adiciona camada extra quando podemos usar Shiki diretamente
- Não resolve o problema de detecção de linguagem

---

## 3. Decisão Técnica

**Abordagem escolhida: Textarea + Overlay com Shiki client-side + `highlight.js` para detecção**

Motivação:
1. É exatamente o que o ray.so faz — validado em produção
2. Shiki já está no projeto e usa o tema `vesper` que já é o nosso
3. Sem migração de editor, apenas evolução do componente existente
4. Bundle mínimo: `highlight.js` pesando ~1.1KB (apenas o módulo de detecção com `highlightAuto`)
5. Mantém total controle sobre o visual

**Alternativa de detecção mais leve:** Se `highlight.js` parecer excessivo, podemos usar heurísticas próprias (regex patterns para as linguagens mais comuns: JS/TS, Python, Rust, Go, Java, SQL, CSS, HTML). Ray.so já lista as linguagens suportadas; podemos limitar a detecção a ~15 linguagens relevantes.

---

## 4. Arquitetura da Solução

### 4.1 Componentes Envolvidos

```
src/
  components/
    ui/
      code-input-form.tsx      ← existente — vai ser refatorado
      code-editor/             ← nova pasta (se necessário separar)
        highlighted-overlay.tsx  ← novo: renderiza HTML do Shiki
  lib/
    detect-language.ts         ← novo: wrapper de detecção via hljs
    shiki-client.ts            ← novo: singleton do highlighter client-side
```

Ou, alternativa mais simples (sem subpasta), tudo dentro de `code-input-form.tsx` com helpers inline — adequado se a complexidade for baixa.

### 4.2 Fluxo de Dados

```
User pastes code
       ↓
  onChange (setCode)
       ↓
  detectLanguage(code)  ←── hljs.highlightAuto (debounced ~300ms)
       ↓
  setDetectedLanguage
       ↓
  highlighter.codeToHtml(code, { lang, theme: "vesper" })
       ↓
  setHighlightedHtml
       ↓
  <div dangerouslySetInnerHTML />  (overlay)
  <textarea value={code} />         (input, transparent)
```

### 4.3 Seleção Manual de Linguagem

- Dropdown no header do editor (junto com os dots vermelho/amarelo/verde)
- Mostra a linguagem detectada como valor padrão com indicador "(auto)"
- Ao selecionar manualmente, o `autoDetect` flag é desativado
- Um botão "auto" ou "x" no dropdown permite resetar para auto-detecção

### 4.4 Estado (sem Jotai — mantendo useState local)

```ts
const [code, setCode] = useState(MOCK_CODE)
const [detectedLang, setDetectedLang] = useState<string>("plaintext")
const [selectedLang, setSelectedLang] = useState<string | null>(null) // null = auto
const [highlightedHtml, setHighlightedHtml] = useState("")
const [isDetecting, setIsDetecting] = useState(false)

const activeLang = selectedLang ?? detectedLang
```

### 4.5 Inicialização do Highlighter

O `createHighlighter` do Shiki é async. No client, inicializamos uma vez via `useEffect` e armazenamos em ref ou módulo singleton:

```ts
// lib/shiki-client.ts
import { createHighlighter } from "shiki"

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["vesper"],
      langs: [], // lazy load
    })
  }
  return highlighterPromise
}
```

---

## 5. Linguagens Suportadas (lista inicial)

Baseado nas linguagens mais comuns em code roasters e no que o ray.so suporta:

| ID (Shiki)    | Label display   | Prioridade |
|---------------|-----------------|------------|
| `typescript`  | TypeScript      | alta       |
| `javascript`  | JavaScript      | alta       |
| `tsx`         | TSX/JSX         | alta       |
| `python`      | Python          | alta       |
| `rust`        | Rust            | alta       |
| `go`          | Go              | alta       |
| `java`        | Java            | média      |
| `cpp`         | C++             | média      |
| `c`           | C               | média      |
| `csharp`      | C#              | média      |
| `php`         | PHP             | média      |
| `sql`         | SQL             | média      |
| `html`        | HTML            | média      |
| `css`         | CSS             | média      |
| `bash`        | Bash/Shell      | média      |
| `json`        | JSON            | baixa      |
| `yaml`        | YAML            | baixa      |
| `markdown`    | Markdown        | baixa      |
| `plaintext`   | Plain Text      | baixa      |

---

## 6. Perguntas em Aberto

> Antes de implementar, as respostas abaixo influenciam decisões concretas:

1. **Debounce do highlight:** O highlighting deve ser em tempo real (a cada keystroke) ou apenas no blur/paste? Para um campo de "paste code", pode ser que aplicar ao `onPaste` + debounce de ~300ms seja suficiente e mais performático.

2. **Highlighting durante digitação:** O usuário vai digitar código no editor ou principalmente colar? Se for majoritariamente paste, podemos simplificar (sem necessidade de sync scroll perfeito, sem tab handling elaborado como o ray.so faz).

3. **Feedback de linguagem detectada:** Onde exibir a linguagem detectada? No header do editor (ao lado dos dots) parece natural. Deve ser sempre visível ou apenas no hover/focus?

4. **Seletor de linguagem manual:** Preferência de UI — dropdown simples (um `<select>` estilizado), um combobox com busca (Base UI tem primitivos para isso), ou botões de opção visíveis?

5. **Escopo das linguagens:** A lista de ~18 linguagens proposta é suficiente? Ou quer suportar tudo que o Shiki tem (~200 linguagens)?

6. **Persistência:** A linguagem selecionada/detectada precisa ser persistida (localStorage, URL hash) ou é ephemeral por sessão?

7. **`highlight.js` vs heurísticas próprias:** A detecção via `hljs.highlightAuto` é a opção mais confiável mas adiciona ~60KB (minified, sem gzip). Aceitável? Ou prefere uma heurística leve customizada para as 18 linguagens da lista?

---

## 7. To-Dos de Implementação

### Fase 1 — Infraestrutura

- [x] Instalar `highlight.js` (v11.11.1 via pnpm)
- [x] Criar `src/lib/shiki-client.ts` — singleton do highlighter para uso client-side
- [x] Criar `src/lib/detect-language.ts` — wrapper de `hljs.highlightAuto` com mapeamento para os IDs do Shiki
- [x] Criar tipo `SupportedLanguage` com a lista de linguagens e seus labels (`src/lib/languages.ts`)

### Fase 2 — Componente de Highlight

- [x] Criar componente `HighlightedOverlay` (inline no form) — recebe `html` e renderiza o overlay
- [x] Implementar CSS para o efeito textarea + overlay:
  - Ambos com mesma font, size, line-height, padding, scroll
  - Textarea com `color: transparent`, `caret-color: text-primary`, `background: transparent`, `WebkitTextFillColor: transparent`
  - Overlay com `pointer-events: none`, `position: absolute`, `top: 0`, `left: 0`
  - `.code-editor-overlay pre` styles in `globals.css`
- [x] Sincronização de scroll entre textarea e overlay (`onScroll` → overlay.scrollTop/scrollLeft)

### Fase 3 — Lógica de Detecção e Estado

- [x] Refatorar `CodeInputForm` para adicionar estados `detectedLang`, `selectedLang`, `highlightedHtml`
- [x] Implementar initial highlight on mount via `useEffect`
- [x] Implementar `useEffect` com debounce (400ms) para detectar linguagem quando `code` muda
- [x] Implementar `useEffect` com debounce (150ms) para re-gerar o HTML de highlight quando `code` ou `activeLang` muda

### Fase 4 — UI do Seletor de Linguagem

- [x] Adicionar indicador de linguagem no header do editor (ao lado dos dots)
- [x] Implementar seletor manual de linguagem (native `<select>` estilizado)
- [x] Mostrar "(auto)" quando a linguagem é detectada automaticamente
- [x] Permitir reset para "auto" via seleção de "__auto__" option
- [x] Styling consistente com design tokens do projeto

### Fase 5 — Integração e Edge Cases

- [x] Garantir que o `caret` (cursor) permanece visível (`caret-text-primary` no textarea)
- [x] Tab handling: insere 2 espaços via `onKeyDown`
- [x] Scroll sync: textarea é o único scroll container (`absolute inset-0`); outer div é `overflow-hidden`
- [x] Fallback: plaintext HTML escape se Shiki não tiver a gramática
- [x] Acessibilidade: `aria-label` no textarea, `aria-hidden` no overlay

### Fase 6 — Qualidade

- [x] Biome: `noDangerouslySetInnerHtml` suprimido com `biome-ignore` comment
- [x] Build Next.js compila limpo (`pnpm build` sem erros)
- [x] Dynamic import de `highlight.js` evita inclusão no bundle server

---

## 8. Referências

- ray.so `Editor.tsx`: https://github.com/raycast/ray-so/blob/main/app/(navigation)/(code)/components/Editor.tsx
- ray.so `HighlightedCode.tsx`: https://github.com/raycast/ray-so/blob/main/app/(navigation)/(code)/components/HighlightedCode.tsx
- ray.so `store/code.ts` (detecção via hljs): https://github.com/raycast/ray-so/blob/main/app/(navigation)/(code)/store/code.ts
- Shiki docs: https://shiki.style
- `shiki` já instalado: `^4.0.2` em `package.json`
- `highlight.js` npm: https://highlightjs.org
