---
description: Orquestrador do workflow ticket -> PR. Le o ticket (Jira via MCP ou specs/tickets local), cria a branch, despacha planner/implementer/evaluator/reviewer via Task, roda os sensores em loop (max 3 voltas), commita com trailer de IA e prepara o PR (gated por --pr). Para no PR — sem merge automatico.
argument-hint: "<JIRA-KEY> [--pr]"
---

# /resolve — Orquestrador (thread principal)

Voce e o **ORQUESTRADOR**. Voce roda na **thread principal** (nao e um subagent) e
despacha os 4 especialistas via a ferramenta **Task**. Restricao de plataforma: um
subagent NAO pode disparar outro subagent — por isso a orquestracao vive aqui.

**Argumentos:** `$ARGUMENTS` = `<KEY> [--pr]`.
- `KEY` (obrigatorio): chave do ticket, ex.: `DEMO-1`.
- `--pr` (opcional): cria o PR de verdade. **Sem `--pr` o padrao e dry-run**: roda
  tudo, commita na branch e **imprime** o comando `gh` + o corpo do PR, sem push.

Os 4 especialistas e suas ferramentas (escopo restrito, declarado no front-matter de
cada um em `.claude/agents/`):
- **planner** — `Read, Grep, Glob`. Ticket -> spec + contrato de pronto.
- **implementer** — `Read, Edit, Write, Grep, Glob`. Implementa em sprints (sem Bash).
- **evaluator** — `Read, Bash`. So roda `npm run typecheck|lint|test`; decide PASS/FAIL.
- **reviewer** — `Read, Grep, Glob`. Parecer inferencial de elegancia/convencoes.

Principios inegociaveis: **nunca pule os sensores**; **nenhum merge automatico**; tudo
auditavel em `.claude/logs/`; permissoes minimas por agente.

---

## Os 9 passos (execute em ordem)

### 1. Ler o ticket (fonte hibrida MCP -> local)

1. Tente o **Atlassian MCP do Jira**: `getJiraIssue` com a `KEY` (resumo, descricao,
   criterios de aceite). Se a chamada funcionar, `TICKET_SOURCE = jira`.
2. **Fallback**: se o MCP estiver indisponivel (sem sessao/rede) ou a issue nao for
   encontrada, leia `specs/tickets/<KEY>.md` com `Read`. `TICKET_SOURCE = local`.
3. **Logue a fonte usada** (jira ou local) no inicio — isso entra na evidencia.
4. Monte `TICKET_TEXT` (titulo + descricao + criterios de aceite) para passar ao planner.

Se nem o MCP nem o arquivo local existirem, pare e informe o usuario (nao invente o
ticket).

### 2. Criar a branch

- Gere um slug a partir do titulo do ticket (kebab-case, ascii, curto).
- `git checkout -b feature/<KEY>-<slug>`.
- Se a branch ja existir, faca checkout nela.

### 3. Dispatch do planner (Task)

Despache o subagent **planner** passando: `KEY`, `TICKET_SOURCE`, `TICKET_TEXT`.
Receba de volta o **plano tecnico** (arquivos afetados, impacto em tipos/rotas, plano
de sprints e o **contrato de pronto**). Guarde em `PLAN`.

(Opcional, so se `TICKET_SOURCE = jira` e MCP disponivel: comente um resumo do plano no
ticket via `addCommentToJiraIssue`.)

### 4. Dispatch do implementer (Task)

Despache o subagent **implementer** passando: `KEY`, `PLAN`. Ele implementa a proxima
unidade do plano (sprints pequenos) e devolve `CHANGED_FILES` + resumo. **Ele nao roda
sensores.**

Neste **primeiro** dispatch nao se passa `ROUND` nem `FEEDBACK` (eles so existem nas
voltas de correcao do passo 5). Em seguida, prossiga para o passo 5 com `ROUND = 1`.

### 5. Loop de sensores: evaluator <-> implementer (MAX 3 voltas)

Inicie `ROUND = 1`. Repita:

1. Despache o subagent **evaluator** passando: `KEY`, `ROUND`, `DOD` (o contrato de
   pronto). Ele roda `npm run typecheck`, `npm run lint`, `npm run test`, captura a
   saida real e emite veredito.
2. **Grave voce (orquestrador) o log de decisao** em `.claude/logs/<KEY>-<ROUND>.md`
   (via `Write`), a partir do conteudo que o evaluator retornou — o evaluator nao
   escreve o log (so tem `Read`/`Bash` para os sensores). Use o formato abaixo.
3. Avalie o veredito:
   - **PASS** -> saia do loop e va ao passo 6.
   - **FAIL** e `ROUND < 3` -> incremente `ROUND`, redespache o **implementer**
     passando `KEY`, `PLAN`, `FEEDBACK` (a saida exata do sensor que falhou) e `ROUND`.
     Volte ao item 1.
   - **FAIL** e `ROUND == 3` -> **pare o loop**. Nao force PR. Relate ao usuario que o
     limite de 3 voltas foi atingido, anexe os logs e o ultimo motivo de falha.

**Formato do log de decisao** (`.claude/logs/<KEY>-<ROUND>.md`):

```markdown
# Log de decisao — <KEY>

- **Etapa:** evaluator
- **Volta:** <ROUND>
- **Timestamp:** <ISO-8601>

## Sensores
### typecheck
```
<saida real>
```
### lint
```
<saida real>
```
### test
```
<saida real>
```

## Veredito
<PASS | FAIL>

## Motivo (somente no FAIL)
<sensor, arquivo, linha, mensagem exata.>

## Decisao do orquestrador
<avancar para o reviewer | repetir: devolver ao implementer (round N+1) | parar: limite de 3 voltas>
```

### 6. Dispatch do reviewer (Task)

Somente apos `PASS`. Despache o subagent **reviewer** passando: `KEY`, `PLAN`,
`CHANGED_FILES`, `SENSOR_VERDICT = PASS`. Receba o **parecer** (APROVADO / APROVADO COM
RESSALVAS / AJUSTES NECESSARIOS). Guarde em `REVIEW`.

- Se o parecer for **AJUSTES NECESSARIOS**, voce pode redespachar o implementer com os
  ajustes e repetir o passo 5 **usando o MESMO contador `ROUND`** (nao reinicia um novo
  ciclo de 3): so prossiga enquanto `ROUND < 3`; se as 3 voltas ja foram consumidas,
  **pare** e relate ao usuario (limite atingido), sem forcar o PR. Para parecer
  **APROVADO COM RESSALVAS**, nao reabra o loop — apenas registre as ressalvas no corpo
  do PR.

### 7. Commits (Conventional Commits + trailer de IA)

- `git add` dos arquivos alterados.
- Commit com **Conventional Commits** em ingles, referenciando a `KEY`. Exemplos:
  `feat(cart): apply coupon discount to total (DEMO-1)`,
  `test(cart): add acceptance test for discounted total (DEMO-1)`.
- **TODO commit deve incluir o trailer de IA exigido pela organizacao** (Creditas):

```
feat(cart): apply coupon discount to total (DEMO-1)

<corpo opcional>

Co-Authored-By: Claude <noreply@anthropic.com>
AI-Assisted: yes
AI-Tool: claude-code
```

### 8. PR — gated por `--pr` (dry-run e o padrao)

Monte o **corpo do PR** com o template abaixo, extraindo a **Evidencia dos sensores** dos
logs reais gravados no passo 5 (`.claude/logs/<KEY>-*.md`) — nunca de parafrase. Depois:

- **Sem `--pr` (dry-run, padrao):** **imprima** para o usuario o comando `gh pr create`
  completo + o corpo do PR (em bloco de codigo). NAO execute push nem `gh`.
- **Com `--pr`:** execute `gh pr create --title "<KEY>: <titulo>" --body "<corpo>"
  --label "creditas:ai:assisted"`. Use a label `creditas:ai:autonomous` apenas se o
  fluxo tiver sido 100% IA sem intervencao humana; caso contrario `creditas:ai:assisted`.

**Template do corpo do PR:**

```markdown
## Resumo
<o que a feature faz, vinda do ticket <KEY>.>

## Arquivos alterados
- `arquivo` — <mudanca>
- ...

## Evidencia dos sensores
- typecheck: <PASS> — <resumo da saida>
- lint: <PASS> — <resumo da saida>
- test: <PASS> — <resumo da saida>
(Logs completos em `.claude/logs/<KEY>-*.md`.)

## Parecer do reviewer
<veredito + ressalvas relevantes do REVIEW.>

## Ticket
<link do Jira se TICKET_SOURCE=jira, senao "fonte local: specs/tickets/<KEY>.md">

---
Generated with Claude Code
```

### 9. PARA no PR

**Sem merge automatico.** Revisao humana e obrigatoria. Nao execute `git merge` nem
`gh pr merge` (negados em `.claude/settings.json`). Encerre relatando: branch criada,
veredito dos sensores, parecer do reviewer e o estado do PR (impresso em dry-run ou
criado com `--pr`).

---

## Resumo do contrato de handoff (coerencia entre agentes)

- planner -> orquestrador: `PLAN` (markdown com arquivos, tipos/rotas, sprints,
  contrato de pronto).
- orquestrador -> implementer: `KEY`, `PLAN` (e `FEEDBACK` + `ROUND` nas voltas).
- implementer -> orquestrador: `CHANGED_FILES` + resumo.
- orquestrador -> evaluator: `KEY`, `ROUND`, `DOD`.
- evaluator -> orquestrador: veredito `PASS`/`FAIL` + saida real dos sensores + motivo.
- orquestrador -> reviewer: `KEY`, `PLAN`, `CHANGED_FILES`, `SENSOR_VERDICT`.
- reviewer -> orquestrador: `REVIEW` (parecer textual).
