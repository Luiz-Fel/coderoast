# plans/ — Guia de Criação de Specs

Este diretório contém especificações de implementação para funcionalidades do CodeRoast. Cada spec é um documento de referência que orienta a implementação sem ser um tutorial passo a passo.

---

## Estrutura de um Spec

### Cabeçalho

```md
# [Nome da Feature] — [Tipo do Documento]
```

Tipos comuns: `Especificação de Implementação`, `Research & Specification`.

---

### Seções obrigatórias

#### `## Contexto`

Explica em 2–4 linhas:
- O que existe hoje (estado atual)
- O que este spec resolve ou adiciona
- Por que é necessário

#### `## [Seção técnica principal]`

Uma ou mais seções com o conteúdo central do spec. Exemplos:
- Schema de banco, enums, relações (Drizzle)
- Análise de abordagens, decisão técnica, arquitetura (feature de UI)

Use tabelas, blocos de código com tipos reais e diagramas em texto quando ajudar a clareza.

#### `## Estrutura de arquivos`

Árvore de diretórios mostrando arquivos novos e modificados. Marque o que é novo e o que é existente com comentários inline.

#### `## To-dos de implementação`

Checklist dividido em fases numeradas. Cada fase tem um nome descritivo.

- Use `- [ ]` para pendente e `- [x]` para concluído
- Cada item deve ser atômico e verificável
- Fases sugeridas: **Infraestrutura → Schema/Core → Lógica → UI → Integração → Qualidade**

---

### Seções opcionais (use quando aplicável)

| Seção | Quando usar |
|---|---|
| `## Opções Avaliadas` | Quando há trade-offs significativos entre abordagens |
| `## Decisão Técnica` | Para registrar a escolha feita e a motivação |
| `## Perguntas em Aberto` | Quando há decisões que dependem de input externo |
| `## Notas de design` | Para decisões não óbvias que precisam de justificativa futura |
| `## Referências` | Links para código externo, docs ou libs relevantes |

---

## Convenções

- **Língua:** Português para documentação, inglês para código e nomes técnicos
- **Código nos specs:** Sempre TypeScript com tipos reais — nunca pseudocódigo
- **Tokens do projeto:** Use os tokens de design (`bg-bg`, `text-brand`, etc.) em specs de UI
- **Não descreva o óbvio:** Omita itens como "instalar dependências" quando for trivial; inclua quando a versão ou flag importa
- **Specs refletem o estado atual:** Ao concluir itens, marque `[x]` no checklist — o spec serve de histórico
