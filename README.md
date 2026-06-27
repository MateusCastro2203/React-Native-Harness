# React Native Harness — `Agent = Model + Harness`

> Repositório-palco da palestra **"Agent = Model + Harness"** (Anthropic), aplicado a um
> app React Native real. O agente lê um ticket do Jira, **planeja → implementa → roda
> sensores → autocorrige → revisa → commita → abre PR** e **para antes do merge**.
> Revisão humana é obrigatória.

A prosa é em **português**; o código, os tipos e as mensagens de commit (Conventional
Commits) são em **inglês**.

---

## 1. O pitch (e por que ele amarra na palestra)

A tese da palestra é simples: um **agente** não é só o modelo — é o modelo **mais o
harness** que o cerca. O harness é o que transforma um chat esperto numa máquina de
entregar software com qualidade auditável.

Este repo torna isso **tangível e executável ao vivo**. Cada peça mapeia 1:1 com um
slide:

| Slide | Conceito | Onde vive no repo |
|-------|----------|-------------------|
| Conceito | Agent = Model + Harness | `CLAUDE.md` + `AGENTS.md` |
| Arquitetura | Contexto · Ferramentas · Controle · Observabilidade | `CLAUDE.md`, `.claude/settings.json`, `.claude/logs/` |
| Anatomia | Planner › Implementer › Evaluator (+ Reviewer) | `.claude/agents/*.md` |
| Ciclo | **Feedforward** (regras) + **Feedback** (sensores) | `CLAUDE.md`/`specs/` + `npm run typecheck\|lint\|test` + reviewer |
| Novo papel | Engenharia de direção, ajuste incremental | este `README` (roteiro de demo) |
| Conclusão | **Shift Quality Left** | pipeline do `/resolve` |
| Demo | Contrato de pronto · erro + autocorreção · repo navegável | **`DEMO-1`** (cupom) |

Duas frases para o palco:

- **"Feedforward + Feedback":** o agente lê as regras *antes* de agir (`CLAUDE.md`,
  `specs/`) e recebe sinais reais *depois* de agir (sensores `typecheck/lint/test` +
  parecer do reviewer).
- **"O harness real impõe restrições; um bom engenheiro de direção projeta dentro
  delas."** No Claude Code um subagent **não** pode disparar outro subagent — por isso o
  **orquestrador não é um subagent**: ele vive no slash command `/resolve` (thread
  principal) e despacha os 4 especialistas via `Task`.

---

## 2. Setup rápido

Pré-requisitos: Node LTS, `git`, e — só se for criar PR de verdade — o `gh` CLI
autenticado.

```bash
# 1. dependências (reconcilia as versões nativas do Expo SDK 52)
npm install

# 2. app rodando (Expo)
npx expo start          # abra no simulador (i / a) ou no Expo Go

# 3. sensores — o "feedback computacional" do harness
npm run typecheck       # tsc --noEmit (TypeScript estrito)
npm run lint            # ESLint
npm run test            # Jest + jest-expo + React Native Testing Library
```

> No **estado inicial da base os três sensores passam.** É de propósito: o palco começa
> verde. O `DEMO-1` é quem fica vermelho — veja §3.

### Smoke check de bundle (rode antes do demo)

```bash
npm run bundle:check    # expo export --platform android (resolve o grafo do Metro)
```

`typecheck/lint/test` **não** empacotam o app — eles não pegam erros de **resolução de
módulo do Metro** (ex.: uma dependência de runtime do `expo-router` faltando, como
`expo-linking`). O `bundle:check` faz um export real e falha cedo se algum módulo não
resolver. Rode-o uma vez antes de apresentar.

> **Troubleshooting — `Unable to resolve "<módulo>"` ao abrir no device:** é uma dep de
> runtime ausente. Instale a versão compatível com o SDK com `npx expo install <módulo>`
> e rode `npm run bundle:check` de novo. (Lição de harness: para um app RN, *bundling* é
> um sensor que vale a pena ter ao lado de `typecheck/lint/test`.)

Stack: Expo SDK 52 · React Native 0.76 · React 18.3 · `expo-router` 4 · TypeScript
estrito · Zustand · styled-components/native · Jest + RNTL.

---

## 3. Roteiro de demo em 60s

O clímax é um comando: **`/resolve DEMO-1`**. Ele encena o ciclo inteiro de forma
**determinística** (o bug está pré-plantado, então o vermelho é garantido).

### 0:00 — Preparar o palco (antes de gravar/apresentar)

- **MCP do Jira (opcional):** com o Atlassian MCP conectado, o `/resolve` lê o ticket
  ao vivo (`getJiraIssue`). **Sem conexão, cai automaticamente para
  `specs/tickets/DEMO-1.md`** — e loga qual fonte usou. *Demo-seguro: roda em qualquer
  máquina.*
- **`gh` (opcional):** só é preciso se você for usar `--pr`. **O padrão é dry-run** (não
  toca no GitHub). Para o palco, deixe **sem `--pr`**.
- Mostre rápido que a base está verde: `npm run test` passando.

### 0:05 — Disparar

```
/resolve DEMO-1
```

Narre cada fase enquanto ela aparece:

1. **Leitura do ticket (fonte híbrida).** Aponte a linha que diz se a fonte foi `jira`
   ou `local`. *"O harness tenta o Jira; se não houver, usa o spec local — e registra a
   decisão."*
2. **Branch.** `feature/DEMO-1-<slug>`. *"Trabalho isolado, nada na main."*
3. **`planner` → contrato de pronto.** Mostre o `PLAN`: arquivos afetados, impacto em
   tipos/rotas e os **critérios de aceite verificáveis**. *"O agente que planeja só
   lê — `Read, Grep, Glob`. Não toca em código."* **Este é o slide do contrato de
   pronto.**
4. **`implementer` → implementação em sprints.** Ele adiciona o **teste de aceite** do
   spec (o total com desconto) e faz a primeira passada. *"O implementer edita e
   escreve, mas **não tem Bash** — ele não roda sensores. Separação de poderes."*
5. **`evaluator` → REPROVA (o momento-chave).** O evaluator roda os 3 sensores; o teste
   novo bate no `applyCoupon` incompleto (desconta o subtotal, **não o total**) e fica
   **vermelho**. Aponte o **veredito FAIL com a asserção exata** na saída. *"Erro
   encontrado por uma máquina, barato e cedo — isto é shift quality left."*
6. **Autocorreção.** O orquestrador devolve o motivo exato ao `implementer` (volta 2);
   ele corrige o `total` e o evaluator roda de novo → **verde**. *"Loop com no máximo 3
   voltas. O orquestrador nunca pula os sensores."*
7. **`reviewer` → parecer inferencial.** Juiz de elegância e aderência a convenções
   (SafeArea, styled-components, camelCase, estrutura). Emite APROVADO / APROVADO COM
   RESSALVAS / AJUSTES NECESSÁRIOS — **sem rodar sensores**. *"Qualidade que o tsc não
   captura."*
8. **Commit + PR (dry-run).** Commits em Conventional Commits (EN) com o **trailer de
   IA da organização**. Como você rodou **sem `--pr`**, o harness **imprime** o comando
   `gh pr create` e o corpo do PR — sem tocar no GitHub. *"Para no PR. Merge é decisão
   humana."* (Para criar de verdade: `/resolve DEMO-1 --pr`.)

### 0:55 — Fechar

Abra `.claude/logs/` e mostre a trilha: a volta que reprovou e a volta que passou
(§4). *"Tudo auditável. O agente não pediu para confiar — ele deixou rastro."*

---

## 4. O que observar nos `.claude/logs/`

Cada volta do loop de sensores grava um arquivo
`.claude/logs/<KEY>-<ROUND>.md`. No `DEMO-1` você verá pelo menos dois:

- **`DEMO-1-1.md` — o FAIL.** É o ouro do demo. Procure por:
  - **Cabeçalho:** `KEY`, etapa (`evaluator`), volta (`1`), timestamp ISO-8601.
  - **Seção `## Sensores`:** a **saída real** de `typecheck`, `lint` e `test` — não um
    resumo, a saída de verdade.
  - **`## Veredito`:** `FAIL`.
  - **`## Motivo`:** o sensor, o arquivo, a linha e a **mensagem exata** (a asserção do
    teste do total com desconto que quebrou contra o `applyCoupon` incompleto).
  - **`## Decisão do orquestrador`:** `repetir: devolver ao implementer (round 2)`.
- **`DEMO-1-2.md` — o PASS.** Mesmos sensores, agora verdes; veredito `PASS`; decisão
  `avancar para o reviewer`.

A leitura dos dois lado a lado é a prova visual do **erro → autocorreção → verde**.

---

## 5. Mapa do repositório

```
.
├─ app/                         # expo-router (telas)
│  ├─ _layout.tsx               # stack raiz + SafeAreaProvider/providers
│  ├─ (tabs)/_layout.tsx        # tabs: Catálogo · Busca · Carrinho
│  ├─ (tabs)/index.tsx          # catálogo (grid)
│  ├─ (tabs)/search.tsx         # busca/filtro
│  ├─ (tabs)/cart.tsx           # carrinho
│  └─ product/[id].tsx          # detalhe do produto
├─ src/
│  ├─ components/               # ProductCard, QtyStepper, Price… (styled-components)
│  ├─ hooks/                    # useProducts, selectors do carrinho
│  ├─ store/                    # cart.store.ts (Zustand) — applyCoupon plantado
│  ├─ services/                 # api.ts (fake: latência + estados loading/error)
│  ├─ data/                     # products.ts (catálogo + categorias)
│  └─ types/                    # Product, Category, CartItem, Coupon
├─ specs/
│  ├─ project.md                # spec do projeto
│  └─ tickets/                  # DEMO-1..DEMO-7 (espelham o Jira)
├─ tests/                       # Jest + RNTL (lógica de carrinho/totais)
├─ .claude/
│  ├─ agents/                   # os 4 especialistas (ferramentas restritas)
│  │  ├─ planner.md             #   Read, Grep, Glob              (só leitura/análise)
│  │  ├─ implementer.md         #   Read, Edit, Write, Grep, Glob (SEM Bash)
│  │  ├─ evaluator.md           #   Read, Bash                    (só roda sensores)
│  │  └─ reviewer.md            #   Read, Grep, Glob              (parecer inferencial)
│  ├─ commands/resolve.md       # /resolve <KEY> [--pr] — o ORQUESTRADOR (thread principal)
│  ├─ logs/                     # logs de decisão (gerados em runtime)
│  └─ settings.json             # allowlist mínima; merge/push --force/rebase negados
├─ AGENTS.md                    # resumo: agentes, regras, workflow, DoD
├─ CLAUDE.md                    # contexto + convenções + Definition of Done
└─ README.md                    # você está aqui
```

### Controle e segurança (o slide do "Controle")

`.claude/settings.json` carrega uma **allowlist mínima**: os sensores
(`npm run typecheck|lint|test`), `npm install`/`npm ci`, `git` para
`status/checkout/switch/branch/add/commit/log/diff` e `gh` para `pr create/view`. E **nega
explicitamente** o que poderia pular a revisão humana:
`git merge`, `gh pr merge`, `git push --force` e `git rebase`. Cada especialista tem
escopo de ferramentas restrito no próprio front-matter. **O orquestrador nunca pula os
sensores e nunca faz merge.**

### Política de IA da organização (Creditas)

Todo commit assistido por IA leva o trailer:

```
Co-Authored-By: Claude <noreply@anthropic.com>
AI-Assisted: yes
AI-Tool: claude-code
```

O corpo do PR inclui **"Generated with Claude Code"** e a label **`creditas:ai:assisted`**
(ou `creditas:ai:autonomous` quando o fluxo foi 100% IA, sem intervenção humana).
