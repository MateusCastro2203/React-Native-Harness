# DEMO-5 — Badge de quantidade no ícone do carrinho

> **Tipo:** História · **Épico:** Carrinho · **Prioridade:** Média
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-5`). Este ticket **descreve** a feature; não a implementa.

## Resumo

Como pessoa usuária, quero ver um indicador (badge) com a quantidade de itens sobre o ícone da aba Carrinho, para saber a qualquer momento quanta coisa coloquei sem abrir o carrinho.

## Descrição

A barra de tabs (`app/(tabs)/_layout.tsx`) tem o ícone da aba Carrinho, mas ele não reflete o estado do carrinho. Precisamos sobrepor um badge numérico ao ícone, alimentado pelo store Zustand (`src/store/cart.store.ts`).

Regras do badge:
- O número exibido é a **quantidade total de itens** — soma das `quantity` de cada `CartItem`, não a contagem de linhas distintas (2 unidades do produto A + 1 do produto B = `3`).
- Quando o carrinho está **vazio**, o badge **não aparece** (sem "0" pendurado no ícone).
- O badge **reage em tempo real** a `add` / `remove` / `updateQty`: adicionar, remover ou alterar quantidade atualiza o número imediatamente.
- Opcional: acima de um teto, exibir "9+" (ou similar) — se adotado, documentar o teto no PLAN.

O valor deve vir de um **selector** (hook em `src/hooks`, ex.: `useCartCount`) sobre o store, e não recalcular o carrinho inteiro na barra de tabs.

### Notas de design (feedforward)
- Badge estilizado com `styled-components/native` (sem `StyleSheet.create` solto). Componente nomeado (ex.: `CartBadge`).
- Selector via hook em `src/hooks` (`useCartCount`), `camelCase`.
- Não introduzir estado duplicado: a fonte de verdade é o store do carrinho.

## Critérios de aceite (verificáveis)

- [ ] Com o carrinho vazio, nenhum badge é renderizado sobre o ícone do Carrinho.
- [ ] Ao adicionar itens, o badge aparece exibindo a **soma das quantidades** (não o número de linhas distintas).
- [ ] Alterar a quantidade de um item (`updateQty`) atualiza o número do badge imediatamente.
- [ ] Remover itens até esvaziar o carrinho faz o badge desaparecer.
- [ ] O número exibido bate com a soma de `quantity` de todos os `CartItem` do store.
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam.

### Dica de teste
Em `tests/`, testar o selector `useCartCount` (ou a função pura de soma) com o store em vários estados: vazio → sem badge; itens com quantidades distintas → soma correta; após `updateQty`/`remove` → valor recalculado. Opcionalmente renderizar a tab e assertar a presença/ausência do badge.

## Arquivos prováveis afetados

- `app/(tabs)/_layout.tsx` — sobrepõe o badge ao ícone da aba Carrinho.
- `src/components/CartBadge.tsx` — **novo** badge estilizado.
- `src/hooks/useCartCount.ts` — **novo** selector da contagem total.
- `src/store/cart.store.ts` — reuso do estado de itens (sem mudança de contrato esperada).
- `tests/` — **novo** teste da contagem/badge.
