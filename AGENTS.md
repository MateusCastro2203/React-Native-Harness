# AGENTS.md — Mapa do Harness

> **Resumo navegável** do harness de agentes deste repositório, a peça central da
> palestra **`Agent = Model + Harness`** aplicada a React Native. Aqui você encontra,
> num só lugar: os 4 especialistas e suas ferramentas restritas, as regras
> (*feedforward*), os sensores (*feedback*), o workflow `/resolve` passo a passo e o
> Contrato de Pronto.
>
> Prosa em **PT-BR**; código, identificadores e mensagens de commit em **EN**.

## Sumário

- [Conceito: Agent = Model + Harness](#conceito-agent--model--harness)
- [Arquitetura: orquestrador + especialistas](#arquitetura-orquestrador--especialistas)
- [Restrição de plataforma (importante)](#restrição-de-plataforma-importante)
- [Anatomia: os 4 agentes](#anatomia-os-4-agentes)
- [Regras — feedforward](#regras--feedforward)
- [Sensores — feedback](#sensores--feedback)
- [Handoff: contrato de I/O entre agentes](#handoff-contrato-de-io-entre-agentes)
- [Workflow `/resolve` passo a passo](#workflow-resolve-passo-a-passo)
- [Log de decisão](#log-de-decisão)
- [DEMO-1: o caso plantado (cupom)](#demo-1-o-caso-plantado-cupom)
- [Contrato de Pronto](#contrato-de-pronto)
- [Controle e segurança](#controle-e-segurança)
- [Política de commits/PR (Creditas)](#política-de-commitspr-creditas)
- [Mapa peça → slide](#mapa-peça--slide)

---

## Conceito: Agent = Model + Harness

> Mapeia o **Slide 01 — Conceito**.

Um agente não é só o modelo. É o **modelo** (que raciocina) somado ao **harness** (o que
dá ao modelo contexto, ferramentas, controle e observabilidade). Este repositório
materializa o harness: regras escritas (`CLAUDE.md`, `specs/`), ferramentas restritas por
papel (`.claude/agents/*.md`), controle (`.claude/settings.json`) e observabilidade
(`.claude/logs/`).

A tese da palestra: a qualidade não vem de um prompt esperto, vem de um **harness bem
projetado** — regras antes da ação (*feedforward*) e sensores depois da ação (*feedback*),
com a descoberta de erros empurrada para a esquerda (*shift quality left*).

---

## Arquitetura: orquestrador + especialistas

> Mapeia o **Slide 02 — Arquitetura** (Contexto · Ferramentas · Controle · Observabilidade).

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

Os quatro pilares do harness, e onde cada um vive:

| Pilar | Onde vive |
|-------|-----------|
| **Contexto** | `CLAUDE.md` (convenções) + `specs/project.md` + `specs/tickets/<KEY>.md` |
| **Ferramentas** | front-matter `tools:` de cada agente em `.claude/agents/*.md` (escopo restrito) |
| **Controle** | `.claude/settings.json` (allowlist mínima; merge negado) + limite de 3 voltas |
| **Observabilidade** | `.claude/logs/<KEY>-<ROUND>.md` (saída real dos sensores + veredito + decisão) |

---

## Restrição de plataforma (importante)

No Claude Code **um subagent NÃO pode disparar outro subagent** (não há aninhamento de
`Task`). Portanto **não existe um subagent "orchestrator"**.

A consequência de projeto, fiel à palestra:

- **O orquestrador vive no slash command `/resolve`** (`.claude/commands/resolve.md`),
  executado pela **thread principal**.
- A thread principal é quem **despacha os 4 especialistas via `Task`**, na ordem certa,
  aplica o Contrato de Pronto, controla o loop e grava os logs.
- `.claude/agents/` contém **apenas os 4 especialistas**: `planner`, `implementer`,
  `evaluator`, `reviewer`. Nenhum deles chama outro.

> Gancho para o palco: *"o harness real impõe restrições; um bom engenheiro de direção
> projeta dentro delas"*.

---

## Anatomia: os 4 agentes

> Mapeia o **Slide 03 — Anatomia** (Planner › Generator › Evaluator + Reviewer). O
> *Generator* da palestra é o nosso **`implementer`**.

Cada especialista tem **ferramentas restritas** declaradas no front-matter YAML
`tools:`. A restrição é deliberada — é parte do controle: o implementer não roda
sensores, o evaluator não edita código, planner e reviewer só leem.

| Agente | Papel | Ferramentas (restritas) | Arquivo |
|--------|-------|--------------------------|---------|
| **planner** | Ticket → spec técnica: arquivos afetados, impacto em tipos/rotas e o **Contrato de Pronto** (critérios de aceite verificáveis). Somente leitura/análise. | `Read, Grep, Glob` | `.claude/agents/planner.md` |
| **implementer** | Implementa em **sprints pequenos** (hook → componente → estilo → integração), uma unidade por vez. Autocorrige no `fail`. **SEM `Bash` de propósito** — não roda sensores. | `Read, Edit, Write, Grep, Glob` | `.claude/agents/implementer.md` |
| **evaluator** | Roda **apenas os 3 sensores** (`typecheck`, `lint`, `test`), decide `PASS`/`FAIL` e, no `fail`, devolve o motivo exato (saída real). Não edita código. | `Read, Bash` | `.claude/agents/evaluator.md` |
| **reviewer** | **Juiz inferencial**: elegância e aderência a design e convenções (SafeArea, styled-components, camelCase, estrutura). Emite parecer textual; **não roda sensores**. | `Read, Grep, Glob` | `.claude/agents/reviewer.md` |

E o **orquestrador**, que não é subagent (vive em `.claude/commands/resolve.md`): lê o
ticket, cria a branch, despacha os 4 via `Task`, controla o loop, grava logs, commita e
prepara o PR. **Nunca pula os sensores.**

---

## Regras — feedforward

> Mapeia o **Slide 04 — Ciclo de qualidade** (lado *antes da ação*).

As regras são consultadas **antes** de qualquer código ser escrito. São o contexto que
guia o modelo. Vivem em `CLAUDE.md` (convenções inegociáveis) e em `specs/` (escopo do
projeto e de cada ticket). Convenções obrigatórias:

- **SafeArea SEMPRE** — `SafeAreaProvider` no `_layout` raiz; toda tela envolvida em
  `SafeAreaView` (`react-native-safe-area-context`).
- **Estilo** — `styled-components/native` com componentes estilizados **nomeados**.
  NUNCA `StyleSheet.create` solto nas telas.
- **Nomes** — `camelCase` para variáveis/funções; `PascalCase` para componentes e
  arquivos de componente (`ProductCard.tsx`); hooks `useX.ts`.
- **Estado global** — Zustand em `src/store`; selectors expostos via hooks em `src/hooks`.
- **Tipagem forte como "sensor natural"** — domínios em `src/types` (`Product`,
  `Category`, `CartItem`, `Coupon`). Sem `any`.
- **Dados 100% mockados** — `src/data/products.ts` + `src/services/api.ts` (latência
  simulada + estados `loading`/`error`). Sem backend.

Quem aplica: **planner** (planeja respeitando as regras), **implementer** (coda
respeitando) e **reviewer** (julga aderência).

---

## Sensores — feedback

> Mapeia o **Slide 04 — Ciclo de qualidade** (lado *depois da ação*).

O feedback tem duas naturezas:

**Sensores computacionais (rápidos, determinísticos)** — rodados de verdade pelo
**evaluator**, exatamente nesta ordem:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run test        # Jest + React Native Testing Library
```

`PASS` só se os três passarem. No `FAIL`, o evaluator captura a **saída real**
(sem parafrasear) e devolve o motivo exato (sensor, arquivo, linha) ao implementer, que
faz a **menor correção** possível. O orquestrador roda esse loop com **limite de 3 voltas**.

**Sensor inferencial (IA como juiz)** — o **reviewer**, chamado **depois** do `PASS`,
avalia o que os sensores rápidos não capturam: elegância, clareza, acoplamento e
aderência às convenções. Emite parecer: `APROVADO` / `APROVADO COM RESSALVAS` /
`AJUSTES NECESSÁRIOS`.

---

## Handoff: contrato de I/O entre agentes

O orquestrador é o único hub; os especialistas nunca falam entre si. As entradas e saídas
são mutuamente consistentes:

| De → Para | Carga (payload) |
|-----------|-----------------|
| planner → orquestrador | `PLAN` (markdown: arquivos afetados, impacto em tipos/rotas, plano de sprints, Contrato de Pronto / DoD) |
| orquestrador → implementer | `KEY`, `PLAN` (+ `FEEDBACK` e `ROUND` nas voltas de correção) |
| implementer → orquestrador | `CHANGED_FILES` + resumo |
| orquestrador → evaluator | `KEY`, `ROUND`, `DOD` |
| evaluator → orquestrador | veredito `PASS`/`FAIL` + saída real dos sensores + motivo exato |
| orquestrador → reviewer | `KEY`, `PLAN`, `CHANGED_FILES`, `SENSOR_VERDICT` |
| reviewer → orquestrador | `REVIEW` (`APROVADO` / `APROVADO COM RESSALVAS` / `AJUSTES NECESSÁRIOS`) |

---

## Workflow `/resolve` passo a passo

> Mapeia o **Slide 06 — Shift Quality Left** (o pipeline completo, com a qualidade
> verificada cedo, antes do humano).

Uso: `/resolve <KEY> [--pr]`. Sem `--pr`, o padrão é **dry-run** (roda tudo, commita na
branch e **imprime** o comando `gh` + o corpo do PR, sem criar nada). Com `--pr`, cria o
PR de verdade.

1. **Lê o ticket (fonte híbrida).** Tenta o Atlassian MCP do Jira (`getJiraIssue`); se
   indisponível, faz *fallback* para `specs/tickets/<KEY>.md`. **Loga a fonte usada**
   (`jira` ou `local`). Se nenhuma existir, para — não inventa o ticket.
2. **Cria a branch** `feature/<KEY>-<slug>` (slug kebab-case a partir do título).
3. **Dispatch do planner** → produz `PLAN` (spec + Contrato de Pronto). Opcional: comenta
   o resumo no ticket via MCP.
4. **Dispatch do implementer** → implementa a próxima unidade do plano (sprints) e
   devolve `CHANGED_FILES`. Não roda sensores.
5. **Loop evaluator ↔ implementer (MÁX 3 voltas).** Evaluator roda os 3 sensores e emite
   veredito; o orquestrador **grava o log** de cada volta em `.claude/logs/`.
   - `PASS` → sai do loop, vai ao passo 6.
   - `FAIL` e `ROUND < 3` → incrementa `ROUND`, redespacha o implementer com `FEEDBACK`.
   - `FAIL` e `ROUND == 3` → **para**; não força PR; relata o limite atingido + logs.
6. **Dispatch do reviewer** (só após `PASS`) → parecer final (`REVIEW`).
7. **Commits** Conventional Commits (EN) referenciando `<KEY>`, com o **trailer de IA**
   exigido pela organização (ver abaixo).
8. **PR — gated por `--pr`.** Dry-run (padrão): imprime `gh pr create` + corpo. Com
   `--pr`: cria com label `creditas:ai:assisted` e corpo contendo *"Generated with Claude
   Code"*, resumo, arquivos alterados, evidência dos sensores, parecer do reviewer e link
   do ticket.
9. **PARA no PR.** Sem merge automático — revisão humana obrigatória. `git merge` e
   `gh pr merge` são **negados** em `.claude/settings.json`.

---

## Log de decisão

Cada volta do loop gera `.claude/logs/<KEY>-<ROUND>.md`, com:

- **Cabeçalho:** `KEY`, etapa (`evaluator`), volta (`ROUND`), timestamp ISO-8601.
- **Sensores:** a saída **real** de `typecheck`, `lint` e `test`.
- **Veredito:** `PASS` | `FAIL`.
- **Motivo** (somente no `FAIL`): sensor, arquivo, linha, mensagem exata.
- **Decisão do orquestrador:** avançar para o reviewer | repetir (devolver ao
  implementer, round N+1) | parar (limite de 3 voltas).

É a camada de **observabilidade** — torna o ciclo auditável.

---

## DEMO-1: o caso plantado (cupom)

> Mapeia o **Slide 07 — Demo** (contrato de pronto, erro + autocorreção, repo navegável).

O caso destacado, **determinístico no palco**:

- **Bug pré-plantado na base:** `src/store/cart.store.ts` traz um `applyCoupon`
  deliberadamente incompleto — desconta apenas o **subtotal exibido**, deixando o
  **total** errado. O teste de aceite (que valida o `total` com desconto) **não existe**
  na base; por isso o estado inicial fica verde.
- **No `/resolve DEMO-1`:** o implementer adiciona o teste de aceite vindo do spec →
  fica **vermelho** contra o código bugado → o evaluator reprova com a **asserção exata**
  (esperado × recebido no `total`) → o implementer corrige o `total` (correção mínima) →
  o evaluator roda de novo → **verde**.

O `FAIL` do evaluator e a autocorreção ficam visíveis em `.claude/logs/`.

---

## Contrato de Pronto

> Definition of Done do harness, produzido pelo planner e verificado pelos sensores.

Cada item do Contrato de Pronto deve ser **verificável** por um sensor
(typecheck/lint/test) ou por inspeção objetiva — nada de critério vago. O esqueleto:

- [ ] Critérios de aceite do ticket atendidos (cada um observável por um sensor).
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam.
- [ ] Convenções respeitadas: SafeArea, styled-components, camelCase/PascalCase,
      estrutura de pastas, tipagem forte (sem `any`).
- [ ] Parecer do reviewer registrado (`APROVADO` ou ressalvas anotadas no PR).
- [ ] Commits com trailer de IA; PR com evidência dos sensores e link do ticket.
- [ ] **Para no PR** — nenhum merge automático.

---

## Controle e segurança

- **Permissões mínimas por agente** — declaradas no `tools:` de cada `.claude/agents/*.md`.
- **Allowlist mínima** em `.claude/settings.json`: sensores (`npm run typecheck|lint|test`),
  `npm install`/`npm ci`, `git` para `status`/`checkout`/`switch`/`branch`/`add`/`commit`/`log`/`diff`
  e `gh pr create|view`.
- **Negados** em `.claude/settings.json`: `git merge`, `gh pr merge`, `git push --force`,
  `git rebase`.
- **O orquestrador nunca pula os sensores** e **nenhum merge acontece sem humano**.
- **Tudo auditável** via `.claude/logs/`.

---

## Política de commits/PR (Creditas)

Todo commit/PR assistido por IA **deve** incluir o trailer:

```
Co-Authored-By: Claude <noreply@anthropic.com>
AI-Assisted: yes
AI-Tool: claude-code
```

E o corpo do PR contém *"Generated with Claude Code"*. Label do PR:
`creditas:ai:assisted` (assistido por humano) ou `creditas:ai:autonomous` (100% IA, sem
intervenção humana).

---

## Mapa peça → slide

> **Slide 05 — Novo papel:** o do humano deixa de ser "digitar o código" e passa a ser
> **engenharia de direção** — escrever as regras, definir o Contrato de Pronto, calibrar
> os sensores e fazer o ajuste incremental. O roteiro de demo do `README.md` encena esse
> novo papel.

| Slide | Conceito | Onde vive no repo |
|-------|----------|-------------------|
| 01 Conceito | Agent = Model + Harness | `CLAUDE.md` + `AGENTS.md` |
| 02 Arquitetura | Contexto · Ferramentas · Controle · Observabilidade | `CLAUDE.md`, `.claude/settings.json`, `.claude/logs/` |
| 03 Anatomia | planner › implementer › evaluator (+ reviewer) | `.claude/agents/*.md` |
| 04 Ciclo de qualidade | Feedforward (regras) + Feedback (sensores) | `CLAUDE.md`/`specs/` + `npm run typecheck\|lint\|test` + reviewer |
| 05 Novo papel | Engenharia de direção, ajuste incremental | `README.md` (roteiro de demo) |
| 06 Shift Quality Left | qualidade verificada cedo, antes do humano | pipeline do `/resolve` (`.claude/commands/resolve.md`) |
| 07 Demo | Contrato de Pronto, erro + autocorreção, repo navegável | `DEMO-1` (cupom) + `.claude/logs/` |
