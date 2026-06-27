# Design — Repo React Native + Harness de Agentes (ticket Jira → PR)

**Data:** 2026-06-26
**Status:** aprovação pendente
**Contexto da palestra:** `Agent = Model + Harness` (Anthropic) — orquestrador + especialistas, feedforward (regras) + feedback (sensores), com descoberta de erros empurrada para a esquerda (*shift quality left*).

---

## 1. Objetivo

Criar um repositório que demonstra, de ponta a ponta, um workflow de desenvolvimento conduzido por agentes sobre um app React Native real. O agente lê um ticket do Jira, planeja, implementa em sprints, roda sensores, autocorrige, passa por um revisor inferencial, commita e abre um Pull Request — parando antes do merge (revisão humana obrigatória).

O repo serve a dois propósitos:
1. **Material de palestra** — cada peça mapeia 1:1 com um slide.
2. **Harness funcional** — o `/resolve <KEY>` roda de verdade no demo ao vivo.

### Mapeamento com os slides

| Slide | Conceito | Onde vive no repo |
|------|----------|-------------------|
| 01 Conceito | Agent = Model + Harness | `CLAUDE.md` + `AGENTS.md` |
| 02 Arquitetura | Contexto · Ferramentas · Controle · Observabilidade | `CLAUDE.md`, `.claude/settings.json`, `.claude/logs/` |
| 03 Anatomia | Planner › Generator › Evaluator (+ Reviewer) | `.claude/agents/*.md` |
| 04 Ciclo | Feedforward (regras) + Feedback (sensores) | `CLAUDE.md`/`specs/` + `npm run typecheck\|lint\|test` + reviewer |
| 05 Novo papel | Engenharia de direção, ajuste incremental | `README.md` (roteiro de demo) |
| 06 Conclusão | Shift Quality Left | pipeline do `/resolve` |
| 07 Demo | Contrato de pronto, erro+autocorreção, repo navegável | `DEMO-1` (cupom) |

---

## 2. Decisões travadas (forks resolvidos com o usuário)

1. **Fonte do ticket:** **Híbrido** — `/resolve` tenta o Atlassian MCP do Jira ao vivo; se falhar (rede/sessão), cai para `specs/tickets/<KEY>.md`. Demo-seguro e o repo roda em qualquer máquina.
2. **Etapa do PR:** **`--pr` configurável**. Padrão = *dry-run* (roda sensores, commita na branch e imprime o comando `gh` + corpo do PR, sem push). Com `--pr`, executa `gh pr create` de verdade.
3. **Idioma:** **PT na narrativa** (docs, specs, README, logs de decisão) + **EN no código** (tipos, identificadores, mensagens de commit Conventional Commits).
4. **Plant do DEMO-1:** **Ambos** — bug pré-plantado na base (garantia determinística no palco) + spec escrito em estilo incremental (lê como workflow real).

---

## 3. Restrição de plataforma (decisão técnica honesta)

No Claude Code **um subagent não pode disparar outro subagent** (sem aninhamento de `Task`). Portanto o **orquestrador não pode ser um subagent** que chama planner/implementer/etc.

**Solução fiel à palestra:**
- **`/resolve` (slash command) É o orquestrador**, executado pela thread principal, que despacha os 4 especialistas via `Task`.
- `.claude/agents/` contém os **4 especialistas** (`planner`, `implementer`, `evaluator`, `reviewer`), cada um com ferramentas restritas.
- O **contrato do orquestrador** (ordem, contrato de pronto, limite de loops, decisão de avançar/repetir) é documentado em `.claude/commands/resolve.md` e resumido em `AGENTS.md`.

> Ótimo gancho para o palco: "o harness real impõe restrições; um bom engenheiro de direção projeta dentro delas".

---

## 4. Arquitetura — Model + Harness

```
                    ┌──────────────────────────────────────────────┐
   ticket <KEY> ──► │  /resolve  (ORQUESTRADOR — thread principal)   │
                    │  lê Jira/local → branch → dispatch → DoD       │
                    └───────┬───────────────┬───────────┬───────────┘
                            │               │           │
                   Task ►   ▼     Task ►     ▼  Task ►   ▼
                      ┌─────────┐   ┌───────────┐  ┌──────────┐  ┌─────────┐
                      │ planner │ ► │implementer│◄►│evaluator │  │reviewer │
                      └─────────┘   └───────────┘  └────┬─────┘  └─────────┘
                       spec+DoD      sprints       sensores↺(máx 3)  parecer
                                                   tsc/lint/test
                            │
                            ▼
                 commits (Conventional) → PR (gh, gated por --pr) → STOP (humano)
```

- **Feedforward (antes da ação):** `CLAUDE.md` (arquitetura, convenções: SafeArea sempre, StyledComponents, camelCase, estrutura de pastas, Definition of Done) + `specs/` (spec do projeto + spec por ticket). Agentes consultam regras e specs **antes** de codar.
- **Feedback (depois da ação):**
  - *Computacional (rápido):* `typecheck`, `lint`, `test` rodados de verdade. Em `fail`, o erro volta ao `implementer` (loop com limite de 3 voltas).
  - *Inferencial (IA como juiz):* `reviewer` dá parecer de elegância/aderência a convenções — qualidade que os sensores rápidos não capturam.
- **Observabilidade:** cada volta grava um log de decisão em `.claude/logs/<KEY>-<timestamp>.md` (pass/fail, motivo, diff de raciocínio). Auditável.
- **Controle:** permissões mínimas por agente (`tools:` no front-matter de cada subagent), allowlist em `.claude/settings.json`, **nenhum merge automático**, orquestrador **nunca pula os sensores**.

---

## 5. Estrutura do repositório

```
.
├─ app/                                # expo-router
│  ├─ _layout.tsx                      # stack raiz + SafeArea/providers
│  ├─ (tabs)/_layout.tsx               # tabs: Catálogo · Busca · Carrinho
│  ├─ (tabs)/index.tsx                 # catálogo (grid)
│  ├─ (tabs)/search.tsx               # busca/filtro (ticket)
│  ├─ (tabs)/cart.tsx                  # carrinho
│  └─ product/[id].tsx                 # detalhe do produto
├─ src/
│  ├─ components/                      # ProductCard, QtyStepper, Price, etc.
│  ├─ hooks/                           # useProducts, useCart selectors
│  ├─ store/                           # cart.store.ts (Zustand)
│  ├─ services/                        # api.ts (fake, latência + erro)
│  ├─ data/                            # products.ts (catálogo + categorias)
│  └─ types/                           # Product, Category, CartItem, Coupon...
├─ specs/
│  ├─ project.md                       # spec do projeto
│  └─ tickets/                         # DEMO-1..DEMO-7 (espelham o Jira)
├─ tests/                              # Jest + RNTL (lógica de carrinho/totais)
├─ .claude/
│  ├─ agents/                          # planner, implementer, evaluator, reviewer
│  ├─ commands/resolve.md              # /resolve <KEY> [--pr]
│  ├─ logs/                            # logs de decisão (gerados em runtime)
│  └─ settings.json                    # permissões + allowlist
├─ AGENTS.md                           # resumo: agentes, regras, workflow, DoD
├─ CLAUDE.md                           # contexto + convenções + Definition of Done
├─ README.md                           # roteiro de demo em 60s
├─ package.json   tsconfig.json   .eslintrc.js   jest.config.js   babel.config.js
└─ app.json                            # config Expo
```

---

## 6. Parte 1 — App base (RN)

**Stack:** Expo SDK 52 · React Native 0.76 · React 18.3 · `expo-router` 4 · TypeScript estrito · Zustand · Jest + `jest-expo` + React Native Testing Library.
(Versões serão reconciliadas via `npx expo install` na implementação; o conjunto acima é coerente e estável.)

### Pronto na base (estado inicial verde)
- **Telas:** catálogo (grid de produtos), detalhe do produto, carrinho.
- **Dados mockados:** `src/data/products.ts` (catálogo + categorias); `src/services/api.ts` com latência simulada e estados `loading`/`error`. Sem backend.
- **Carrinho (Zustand):** `add` / `remove` / `updateQty`, cálculo de `subtotal` e `total`. Favoritos opcionais.
- **Tipos de domínio:** `Product`, `Category`, `CartItem`, `Coupon` — tipagem forte como "sensor natural".
- **Sensores configurados:** scripts `typecheck` (`tsc --noEmit`), `lint` (ESLint), `test` (Jest + RNTL com testes do carrinho: totais, quantidades). **Todos passam no estado inicial.**

### Backlog (tickets — NÃO implementados na base)
Complexidade crescente, cada um vira `specs/tickets/<KEY>.md` (espelhando o Jira):

| Ticket | Feature |
|--------|---------|
| `DEMO-1` | Cupom de desconto no carrinho **(o demo destacado)** |
| `DEMO-2` | Filtro por categoria |
| `DEMO-3` | Busca por nome |
| `DEMO-4` | Ordenação por preço |
| `DEMO-5` | Badge de quantidade no ícone do carrinho |
| `DEMO-6` | Frete grátis acima de X |
| `DEMO-7` | Resumo de checkout |

> **Nota sobre o DEMO-1:** a feature de cupom (UI de inserir código + aplicar ao `total` + teste de aceite) é o ticket. A base inclui *apenas* um `applyCoupon` deliberadamente incompleto (desconta só o subtotal exibido) como bug plantado — ver §9. Isso não conta como "feature implementada"; é a semente da falha do demo.

---

## 7. Parte 2 — O harness (mapeado 1:1)

### Orquestrador — `.claude/commands/resolve.md`
Dono do workflow (roda na thread principal). Recebe `<KEY> [--pr]`, despacha os especialistas na ordem certa, aplica o contrato de pronto, decide avançar/repetir e grava os logs de decisão.

### Especialistas — `.claude/agents/*.md` (escopo + ferramentas restritas)

| Agente | Papel | Ferramentas (restritas) |
|--------|------|--------------------------|
| `planner` | Ticket → spec técnica: arquivos afetados, impacto em tipos/rotas, **critérios de aceite (contrato de pronto)** | Read, Grep, Glob, MCP Jira (read) |
| `implementer` | Implementa em sprints pequenos (hook → componente → estilo). Uma unidade por vez. Autocorrige no `fail`. | Read, Edit, Write, Grep, Glob |
| `evaluator` | Roda os sensores e decide `pass`/`fail`; no `fail`, devolve o motivo ao implementer | Bash (apenas `npm run typecheck\|lint\|test`), Read |
| `reviewer` | Juiz inferencial: elegância, aderência a design/convenções; emite parecer | Read, Grep, Glob |

### Feedforward (regras)
- `CLAUDE.md` na raiz: arquitetura, convenções, Definition of Done, como invocar o workflow.
- `specs/project.md` + specs por ticket. Consulta obrigatória antes de codar.

### Feedback (sensores)
- Computacional: `typecheck`, `lint`, `test` (reais). Loop implementer↔evaluator, **máx. 3 voltas**.
- Inferencial: parecer do `reviewer`.

---

## 8. Parte 3 — Workflow do `/resolve <KEY> [--pr]`

1. **Lê o ticket.** Tenta Atlassian MCP (resumo, descrição, critérios de aceite); fallback para `specs/tickets/<KEY>.md`. Loga a fonte usada.
2. **Cria branch** `feature/<KEY>-slug`.
3. **`planner`** → spec + contrato de pronto. (Opcional: comenta resumo no ticket via MCP.)
4. **`implementer`** → implementa em sprints.
5. **`evaluator`** → roda sensores; `fail` retorna ao implementer (até o limite); grava log de decisão de cada volta em `.claude/logs/`.
6. **`reviewer`** → parecer final.
7. **Commits** Conventional Commits referenciando `<KEY>` (com trailer de IA exigido pela organização).
8. **PR** (somente com `--pr`): `gh pr create` com descrição estruturada — resumo, arquivos alterados, evidência dos sensores (saída de typecheck/lint/test), parecer do reviewer e link do ticket. Sem `--pr`: imprime o comando + corpo.
9. **Para no PR.** Sem merge automático. Revisão humana obrigatória.

---

## 9. DEMO-1 — o caso plantado (cupom)

**Critério de aceite:** inserir um código de cupom válido aplica % de desconto **ao `total`** do carrinho (não só ao subtotal exibido).

**Plant (abordagem "ambos"):**
- **Bug pré-plantado na base:** `src/store/cart.store.ts` já tem um `applyCoupon` incompleto — guarda o cupom e desconta **apenas no `subtotal` exibido**, deixando o `total` errado. O teste de aceite **não existe** na base (por isso o estado inicial fica verde).
- **Spec incremental:** `specs/tickets/DEMO-1.md` traz o teste de aceite (`total` com desconto) + instrução de sprint incremental ("primeiro o subtotal, depois o total").
- **No `/resolve DEMO-1`:** o `implementer` adiciona o teste vindo do spec → roda → **vermelho** contra o código bugado → `evaluator` reprova com motivo → `implementer` corrige o `total` no segundo passe → **verde**. O log do evaluator falhando + a autocorreção ficam visíveis em `.claude/logs/`.

Resultado: o momento-chave do demo é **determinístico no palco** e ainda lê como workflow real.

---

## 10. Parte 4 — Integrações e segurança

- **Jira:** Atlassian MCP (ler ticket; opcionalmente comentar/transicionar). Fallback local.
- **GitHub:** `git` + `gh` CLI para branch, commit e PR.
- **Controle:** permissões mínimas por agente; nenhum merge sem humano; orquestrador nunca pula sensores; tudo auditável pelos logs de decisão.
- **Org Creditas:** commits/PRs assistidos por IA levam o trailer `Co-Authored-By` + `AI-Assisted: yes` + `AI-Tool: claude-code`; PR recebe label `creditas:ai:assisted` (ou `creditas:ai:autonomous` se 100% IA).

---

## 11. Critérios de pronto (Definition of Done do repo)

- [ ] App base roda (`npx expo start`) e `npm run typecheck && lint && test` passam no estado inicial.
- [ ] `/resolve <KEY>` executa o pipeline completo: lê Jira/local → branch → plan → implementa → sensores → reviewer → commit → PR (gated).
- [ ] `DEMO-1` (cupom) demonstra teste reprovado + autocorreção visível nos logs.
- [ ] Cada subagent tem escopo/ferramentas restritas e consulta regras + specs.
- [ ] PR criado com evidência dos sensores e link do ticket; sem merge automático.
- [ ] `AGENTS.md` e `CLAUDE.md` refletem fielmente o workflow real.

---

## 12. Riscos e mitigação

| Risco | Mitigação |
|------|-----------|
| Versões Expo/RN incompatíveis (não dá pra `npm install` aqui com certeza total) | Pinar conjunto coerente (SDK 52) + instrução `npx expo install` para reconciliar; testes de lógica pura (carrinho) não dependem de nativo |
| MCP do Jira indisponível no palco | Fallback local `specs/tickets/` (decisão híbrida) |
| `gh pr create` falhar/poluir repo no palco | Default dry-run; `--pr` só quando quiser |
| Não-determinismo do LLM no DEMO-1 | Bug pré-plantado garante o vermelho |
| Subagent tentando aninhar subagent | Orquestração na thread principal (slash command) |

---

## 13. Plano de entrega (em sprints — como o harness opera)

1. **Sprint 0 — Fundação do harness (este passo, para aprovação):** estrutura + `CLAUDE.md` + `AGENTS.md` + `specs/` + definições dos 4 subagents + `.claude/commands/resolve.md` + `.claude/settings.json`.
2. **Sprint 1 — App base:** config Expo/TS/ESLint/Jest, tipos, dados mockados, fake API, store do carrinho (com o `applyCoupon` bugado plantado), telas catálogo/detalhe/carrinho, testes do carrinho verdes.
3. **Sprint 2 — `/resolve` e DEMO-1:** finalizar o slash command, validar o pipeline ponta a ponta com `DEMO-1`, garantir os logs de decisão e o roteiro de demo no `README`.

Entrega incremental, com checkpoint de revisão entre sprints.
