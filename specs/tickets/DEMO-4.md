# DEMO-4 — Ordenação por preço (ascendente / descendente)

> **Tipo:** História · **Épico:** Catálogo & Descoberta · **Prioridade:** Média
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-4`). Este ticket **descreve** a feature; não a implementa.

## Resumo

Como pessoa usuária, quero ordenar os produtos do catálogo por preço (do menor para o maior e vice-versa), para comparar opções pela faixa de valor.

## Descrição

O catálogo (`app/(tabs)/index.tsx`) exibe os produtos na ordem em que vêm dos dados mockados (`src/data/products.ts`), sem controle de ordenação. Cada `Product` já tem um campo de preço numérico (`price`) em `src/types`.

Queremos um controle de ordenação por preço com três estados:
1. **Padrão** — ordem original dos dados (sem ordenação aplicada).
2. **Crescente** — menor preço primeiro.
3. **Decrescente** — maior preço primeiro.

O controle pode ser um toggle/segmented com rótulos claros (ex.: "Preço ↑" / "Preço ↓") ou um botão que cicla entre os três estados. O estado ativo deve ser visualmente indicado, e o critério de ordenação precisa ser **estável** (produtos de mesmo preço mantêm sua ordem relativa de origem).

A ordenação deve **compor** com o filtro por categoria do DEMO-2 quando ambos existirem: ordena o conjunto já filtrado, sem perder o recorte de categoria.

### Notas de design (feedforward)
- `SafeAreaView` mantido; estilização via `styled-components/native` (sem `StyleSheet.create` solto). Componente estilizado nomeado (ex.: `SortControl`).
- Não mutar o array de origem — ordenar sobre uma cópia (preservar `products.ts` intacto).
- `camelCase` para o estado/handlers; tipo de ordenação forte (ex.: `type PriceSort = 'none' | 'asc' | 'desc'` em `src/types`), sem `any`.

## Critérios de aceite (verificáveis)

- [ ] O catálogo exibe um controle de ordenação por preço com os estados padrão, crescente e decrescente.
- [ ] No estado crescente, o primeiro item tem o menor `price` e a sequência é não-decrescente.
- [ ] No estado decrescente, o primeiro item tem o maior `price` e a sequência é não-crescente.
- [ ] No estado padrão, a ordem é exatamente a dos dados de origem.
- [ ] A ordenação é estável (itens de preço igual mantêm a ordem relativa original) e não muta o array de origem.
- [ ] Quando houver filtro de categoria ativo (DEMO-2), a ordenação se aplica ao conjunto filtrado sem remover o recorte.
- [ ] O estado de ordenação ativo é indicado visualmente.
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam (tipo de ordenação sem `any`).

### Dica de teste
Em `tests/`, isolar a função de ordenação (ex.: `sortByPrice(products, 'asc')`) e assertar a sequência de `price` resultante; incluir um par de itens com preço igual para checar estabilidade. Na tela, simular o toggle e verificar a ordem dos produtos renderizados.

## Arquivos prováveis afetados

- `app/(tabs)/index.tsx` — controle de ordenação + grid ordenado.
- `src/components/SortControl.tsx` — **novo** controle estilizado.
- `src/hooks/useProducts.ts` — composição filtro+ordenação / util `sortByPrice`.
- `src/types/` — `type PriceSort` (novo tipo de domínio de UI).
- `tests/` — **novo** teste da ordenação (unidade + tela).
