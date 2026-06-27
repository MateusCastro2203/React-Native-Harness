# DEMO-7 — Resumo de checkout (itens, subtotal, desconto, frete, total)

> **Tipo:** História · **Épico:** Checkout · **Prioridade:** Alta
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-7`). Este ticket **descreve** a feature; não a implementa.
> **Depende de:** DEMO-1 (cupom/desconto) e DEMO-6 (frete) — este ticket **agrega** os valores que esses tickets introduzem.

## Resumo

Como pessoa usuária, quero ver um resumo claro do meu pedido antes de finalizar — itens, subtotal, desconto, frete e total — para conferir exatamente o que e quanto vou pagar.

## Descrição

Esta é a feature de maior complexidade do backlog porque **integra** as regras dos tickets anteriores num único bloco de resumo coerente. O carrinho (`app/(tabs)/cart.tsx`) já lista itens e mostra `subtotal`/`total`; precisamos consolidar um **Resumo de Checkout** com cinco grupos:

1. **Itens** — contagem total de itens (soma das `quantity`, reusando a lógica do DEMO-5) e, opcionalmente, a relação resumida dos produtos.
2. **Subtotal** — soma de `price × quantity` de todos os `CartItem`.
3. **Desconto** — valor do desconto aplicado pelo cupom (DEMO-1); `R$0,00` (ou linha oculta) quando não houver cupom. Exibir o código do cupom quando aplicável.
4. **Frete** — valor do frete (DEMO-6): "Grátis" acima do limiar, valor padrão abaixo.
5. **Total** — `subtotal − desconto + frete`, sempre coerente com as linhas acima e **nunca negativo** (clamp em zero se o desconto exceder subtotal+frete).

Regras:
- Todos os valores monetários formatados em **BRL** (R$) de forma consistente.
- O resumo deve ser **derivado** do store (selector único, ex.: `useCheckoutSummary` retornando `{ itemCount, subtotal, discount, shipping, total }`), e a tela apenas renderiza — sem recalcular regras de negócio na view.
- Carrinho vazio: exibir estado vazio (sem resumo com zeros confusos) ou um resumo neutro consistente.
- A **identidade contábil** deve sempre fechar: `total === subtotal − discount + shipping` (com clamp em zero).

### Notas de design (feedforward)
- `SafeAreaView`; bloco de resumo com `styled-components/native` (sem `StyleSheet.create` solto). Componente nomeado (ex.: `CheckoutSummary`, `SummaryRow`).
- Um único selector agrega tudo (`useCheckoutSummary`), reusando seletores existentes (contagem do DEMO-5, frete do DEMO-6, desconto do DEMO-1) em vez de duplicar lógica.
- Tipos fortes para o resumo (ex.: `type CheckoutSummary` em `src/types`), sem `any`. `camelCase` nos campos.

## Critérios de aceite (verificáveis)

- [ ] O carrinho exibe um bloco de resumo com as linhas: itens, subtotal, desconto, frete e total.
- [ ] **Itens** mostra a soma das `quantity` (consistente com o badge do DEMO-5).
- [ ] **Subtotal** é a soma de `price × quantity` de todos os itens.
- [ ] **Desconto** reflete o cupom do DEMO-1 (e some/zera quando não há cupom); o total já considera o desconto.
- [ ] **Frete** reflete a regra do DEMO-6 ("Grátis" ou valor padrão conforme o limiar).
- [ ] **Total** satisfaz `total === subtotal − discount + shipping` em todos os casos e nunca é negativo.
- [ ] Todos os valores são formatados em BRL de forma consistente.
- [ ] Carrinho vazio exibe estado vazio coerente (sem resumo com zeros enganosos).
- [ ] O resumo vem de um selector único; a tela não recalcula regras de negócio.
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam.

### Dica de teste
Em `tests/`, testar `useCheckoutSummary` (ou a função pura agregadora) com cenários combinados: (a) sem cupom e abaixo do frete grátis; (b) com cupom e acima do frete grátis; (c) cupom cujo desconto excede subtotal+frete → total clampado em `0`. Em cada cenário, assertar campo a campo e a identidade `total === subtotal − discount + shipping`.

## Arquivos prováveis afetados

- `app/(tabs)/cart.tsx` — renderiza o bloco de resumo.
- `src/components/CheckoutSummary.tsx` — **novo** bloco de resumo estilizado (+ `SummaryRow`).
- `src/hooks/useCheckoutSummary.ts` — **novo** selector agregador (itens/subtotal/desconto/frete/total).
- `src/store/cart.store.ts` — reuso de subtotal/total/cupom/frete (sem duplicar regra).
- `src/types/` — `type CheckoutSummary` e formatação monetária.
- `tests/` — **novo** teste do resumo de checkout (cenários combinados).
