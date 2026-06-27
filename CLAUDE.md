# CLAUDE.md — Contexto + Feedforward

> **Leia este documento ANTES de codar.** Ele é o contrato de *feedforward* (regras antes da ação) que **todo agente** consulta no início de cada tarefa. A prosa está em **português do Brasil**; o **código, tipos, identificadores e mensagens de commit em inglês**.

---

## (a) O que é o projeto — Agent = Model + Harness

Este repositório é o material da palestra **"Agent = Model + Harness"** (Anthropic) aplicado a **React Native**. Ele demonstra, de ponta a ponta, um workflow de desenvolvimento conduzido por agentes sobre um app real:

```
ticket Jira → plano → implementação → sensores → reviewer → commit → PR (para antes do merge)
```

O conceito central da palestra:

- **Agent = Model + Harness.** O *Model* é a inteligência (raciocínio do LLM). O *Harness* é tudo ao redor que dá direção e segurança: contexto, ferramentas, controle e observabilidade.
- **Feedforward (regras, antes da ação):** este `CLAUDE.md` + `specs/` definem arquitetura, convenções e o contrato de pronto. Os agentes consultam as regras **antes** de escrever código.
- **Feedback (sensores, depois da ação):**
  - *Computacional (rápido):* `typecheck`, `lint`, `test` rodam de verdade; no `fail`, o erro volta ao implementer (loop com limite).
  - *Inferencial (IA como juiz):* o `reviewer` dá parecer de elegância e aderência a convenções — qualidade que os sensores rápidos não capturam.
- **Shift Quality Left:** a descoberta de erros é empurrada para a esquerda do pipeline (o mais cedo possível), via tipagem forte, sensores e contrato de pronto explícito.

O repo serve a dois propósitos: (1) **material de palestra** — cada peça mapeia 1:1 com um slide; (2) **harness funcional** — `/resolve <KEY>` roda de verdade no demo ao vivo.

---

## (b) Arquitetura e estrutura de pastas

### Model + Harness (visão de alto nível)

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

> **Restrição de plataforma (importante):** no Claude Code **um subagent NÃO pode disparar outro subagent**. Por isso o **orquestrador NÃO é um subagent** — ele vive no slash command **`/resolve`**, executado na **thread principal**, que despacha os 4 especialistas via `Task`. Não existe subagent `orchestrator`.

### Stack

Expo SDK 52 · React Native 0.76 · React 18.3 · `expo-router` 4 · TypeScript estrito · Zustand · `styled-components/native` · Jest + `jest-expo` + React Native Testing Library.

> As versões serão reconciliadas via `npx expo install` na implementação; o conjunto acima é coerente e estável.

### Estrutura de pastas

```
.
├─ app/                                # expo-router (file-based routing)
│  ├─ _layout.tsx                      # stack raiz + SafeAreaProvider + providers
│  ├─ (tabs)/_layout.tsx               # tabs: Catálogo · Busca · Carrinho
│  ├─ (tabs)/index.tsx                 # catálogo (grid de produtos)
│  ├─ (tabs)/search.tsx                # busca/filtro (ticket)
│  ├─ (tabs)/cart.tsx                  # carrinho
│  └─ product/[id].tsx                 # detalhe do produto
├─ src/
│  ├─ components/                      # ProductCard, QtyStepper, Price, etc.
│  ├─ hooks/                           # useProducts, selectors de carrinho (useX.ts)
│  ├─ store/                           # cart.store.ts (Zustand)
│  ├─ services/                        # api.ts (fake: latência + estados loading/error)
│  ├─ data/                            # products.ts (catálogo + categorias)
│  └─ types/                           # Product, Category, CartItem, Coupon...
├─ specs/
│  ├─ project.md                       # spec do projeto
│  └─ tickets/                         # DEMO-1..DEMO-7 (espelham o Jira)
├─ tests/                              # Jest + RNTL (lógica de carrinho/totais)
├─ .claude/
│  ├─ agents/                          # planner, implementer, evaluator, reviewer
│  ├─ commands/resolve.md              # /resolve <KEY> [--pr]  (o ORQUESTRADOR)
│  ├─ logs/                            # logs de decisão (gerados em runtime)
│  └─ settings.json                    # permissões + allowlist (controle)
├─ AGENTS.md                           # resumo: agentes, regras, workflow, DoD
├─ CLAUDE.md                           # este arquivo (contexto + convenções + DoD)
└─ README.md                           # roteiro de demo em 60s
```

### Os quatro pilares do harness

- **Contexto:** `CLAUDE.md` + `specs/` (feedforward).
- **Ferramentas:** ferramentas restritas por agente (front-matter `tools:`) + allowlist em `.claude/settings.json`.
- **Controle:** permissões mínimas, **nenhum merge automático**, orquestrador **nunca pula sensores**.
- **Observabilidade:** cada volta grava um log de decisão em `.claude/logs/<KEY>-<ROUND>.md`.

---

## (c) Convenções (feedforward / regras)

Estas regras são **obrigatórias**. O `reviewer` as cobra no parecer inferencial e o `evaluator` as captura via tipagem/lint.

- **SafeArea SEMPRE.**
  - `SafeAreaProvider` no `_layout.tsx` raiz.
  - Toda tela envolvida em `SafeAreaView` de `react-native-safe-area-context` (nunca a `SafeAreaView` do `react-native`).
- **Estilo: `styled-components/native`.**
  - **NUNCA** `StyleSheet.create` solto nas telas.
  - Componentes estilizados **nomeados** (ex.: `Container`, `Title`, `CardWrapper`) — não estilos anônimos inline.
- **Nomes:**
  - `camelCase` para variáveis e funções.
  - `PascalCase` para componentes e arquivos de componente (`ProductCard.tsx`).
  - Hooks como `useX.ts` (ex.: `useCart.ts`, `useProducts.ts`).
- **Estado global: Zustand** em `src/store` (ex.: `cart.store.ts`). Selectors expostos via hooks em `src/hooks`.
- **Tipagem forte como "sensor natural".** Domínios em `src/types` (`Product`, `Category`, `CartItem`, `Coupon`). TypeScript estrito; evitar `any`. Erros de tipo são pegos pelo `typecheck` antes do runtime.
- **Dados 100% mockados (sem backend).** `src/data/products.ts` (catálogo + categorias) consumido por `src/services/api.ts`, que simula **latência** e expõe estados de `loading`/`error`.
- **Idioma:** prosa (docs, specs, comentários de orientação, logs) em **PT-BR**; código, identificadores e commits em **EN**.

---

## (d) Sensores e como rodá-los

Os sensores são o *feedback computacional rápido*. Quem os roda é o **`evaluator`** (único agente com `Bash`, restrito a estes três comandos). O `implementer` **não** roda sensores.

```bash
npm run typecheck    # tsc --noEmit   — checagem de tipos (TypeScript estrito)
npm run lint         # ESLint         — estilo e padrões
npm run test         # Jest + RNTL    — lógica de carrinho/totais e testes de aceite
```

- No **estado inicial da base**, os três passam (verde).
- No `fail`, o `evaluator` devolve a **saída real do sensor** (motivo exato) ao orquestrador, que reenvia ao `implementer` para autocorreção. Loop com **máximo de 3 voltas**.

---

## (e) Definition of Done (explícita)

Uma tarefa só está **pronta** quando **TODOS** os itens abaixo são verdadeiros:

- [ ] **`npm run typecheck` passa** (sem erros de tipo).
- [ ] **`npm run lint` passa** (sem erros de lint).
- [ ] **`npm run test` passa**, incluindo o(s) **teste(s) de aceite** do ticket.
- [ ] As **convenções da seção (c)** são respeitadas: SafeArea, `styled-components/native`, `camelCase`/`PascalCase`, tipagem forte, dados mockados, estrutura de pastas.
- [ ] A implementação atende ao **contrato de pronto** definido pelo `planner` (critérios de aceite verificáveis do ticket).
- [ ] O `reviewer` emitiu parecer **APROVADO** ou **APROVADO COM RESSALVAS** (RESSALVAS exigem nota explícita; **AJUSTES NECESSÁRIOS** reprova).
- [ ] Cada volta do loop tem **log de decisão** gravado em `.claude/logs/<KEY>-<ROUND>.md`.
- [ ] Commits seguem **Conventional Commits (EN)**, referenciam `<KEY>` e incluem o **trailer de IA** (ver seção g).
- [ ] **Nenhum merge automático.** O pipeline **para no PR**; revisão humana é obrigatória.

---

## (f) Como invocar o workflow — `/resolve <KEY> [--pr]`

O orquestrador vive em `.claude/commands/resolve.md` (thread principal) e despacha os 4 especialistas via `Task`. São **9 passos**:

1. **Lê o ticket.** Tenta o Atlassian MCP do Jira (`getJiraIssue`); fallback para `specs/tickets/<KEY>.md`. **Loga a fonte usada.**
2. **Cria branch** `feature/<KEY>-slug`.
3. **Dispatch `planner`** → PLAN + contrato de pronto.
4. **Dispatch `implementer`** → implementa em sprints pequenos.
5. **Loop `evaluator` ↔ `implementer`** → roda sensores; no `fail`, volta ao implementer. **Máx. 3 voltas**, com log por volta em `.claude/logs/`.
6. **Dispatch `reviewer`** → parecer final.
7. **Commits** Conventional Commits (EN) referenciando `<KEY>`, com **trailer de IA**.
8. **PR gated por `--pr`.** *Default = dry-run* (imprime o comando `gh` + corpo do PR, sem push). Com `--pr`, executa `gh pr create` com label `creditas:ai:assisted` e corpo contendo "Generated with Claude Code".
9. **Para no PR.** Sem merge automático (negado no `settings.json`).

### Papel de cada subagent (ferramentas restritas no front-matter `tools:`)

| Agente | Papel | Ferramentas (escopo restrito) |
|--------|-------|-------------------------------|
| **`planner`** | Ticket + specs + regras → **PLAN**: arquivos afetados, impacto em tipos/rotas, plano de sprints e **contrato de pronto** (critérios de aceite verificáveis). | `Read`, `Grep`, `Glob` — somente leitura/análise. |
| **`implementer`** | Implementa em sprints pequenos (um hook, depois o componente, depois o estilo — uma unidade por vez). Autocorrige no `fail` do evaluator. | `Read`, `Edit`, `Write`, `Grep`, `Glob` — **SEM `Bash`** (não roda sensores). |
| **`evaluator`** | Roda **apenas** os 3 sensores. Decide `PASS`/`FAIL`; no `fail`, devolve o motivo exato (saída real do sensor). Não edita código. | `Read`, `Bash` (restrito aos 3 sensores). |
| **`reviewer`** | Juiz inferencial: elegância, aderência ao design e às convenções. Emite parecer. Não roda sensores. | `Read`, `Grep`, `Glob`. |

### Handoff (I/O mutuamente consistente)

- `planner` → orquestrador: **PLAN** (markdown: arquivos afetados, impacto tipos/rotas, plano de sprints, contrato de pronto/DoD).
- orquestrador → `implementer`: **KEY**, **PLAN** (+ **FEEDBACK** e **ROUND** nas voltas).
- `implementer` → orquestrador: **CHANGED_FILES** + resumo.
- orquestrador → `evaluator`: **KEY**, **ROUND**, **DOD**.
- `evaluator` → orquestrador: veredito **PASS/FAIL** + saída real dos sensores + motivo exato.
- orquestrador → `reviewer`: **KEY**, **PLAN**, **CHANGED_FILES**, **SENSOR_VERDICT**.
- `reviewer` → orquestrador: **REVIEW** (APROVADO / APROVADO COM RESSALVAS / AJUSTES NECESSÁRIOS).

### Formato do log de decisão — `.claude/logs/<KEY>-<ROUND>.md`

Cada arquivo contém: **cabeçalho** (KEY, etapa, número da volta, timestamp ISO) + seção **SENSORES** (saída real de `typecheck`/`lint`/`test`) + **Veredito** `PASS`/`FAIL` + **Motivo** (no `fail`) + **Decisão do orquestrador** (avançar/repetir).

### DEMO-1 (cupom) — o caso destacado e determinístico

A base traz um `applyCoupon` **deliberadamente incompleto** em `src/store/cart.store.ts` (desconta apenas o `subtotal` exibido, **não** o `total`). O teste de aceite (que valida o `total` com desconto) **não existe** na base — por isso o estado inicial fica verde.

No `/resolve DEMO-1`: o `implementer` adiciona o teste vindo do spec → fica **VERMELHO** contra o código bugado → `evaluator` reprova com **assertion exata** → `implementer` corrige o `total` → **VERDE**. O fail do evaluator + a autocorreção ficam visíveis nos logs. Determinismo garantido no palco.

---

## (g) Política da organização (Creditas) — commits/PR de IA

**SEMPRE** que um commit for assistido por IA, incluir o **trailer** no corpo do commit:

```
Co-Authored-By: Claude <noreply@anthropic.com>
AI-Assisted: yes
AI-Tool: claude-code
```

E no corpo do PR incluir: **"Generated with Claude Code"**.

**Label do PR:**

- `creditas:ai:assisted` — PR com assistência de IA (uso padrão deste repo).
- `creditas:ai:autonomous` — PR 100% IA (sem intervenção humana).

> **Segurança/controle:** allowlist mínima em `.claude/settings.json` — sensores (`npm run typecheck|lint|test`), `npm install`/`npm ci`, `git` para `status`/`checkout`/`switch`/`branch`/`add`/`commit`/`log`/`diff` e `gh pr create`/`view`. **Negados:** `git merge`, `gh pr merge`, `git push --force`, `git rebase`. O orquestrador **nunca pula os sensores** e **nunca faz merge** — revisão humana é obrigatória.
