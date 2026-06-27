# DEMO-2 — Filtro por categoria no catálogo

> **Tipo:** História · **Épico:** Catálogo & Descoberta · **Prioridade:** Média
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-2`). Este ticket **descreve** a feature; não a implementa.

## Resumo

Como pessoa usuária navegando no catálogo, quero filtrar os produtos por categoria para encontrar mais rápido o que procuro sem rolar a lista inteira.

## Descrição

Hoje a tela de catálogo (`app/(tabs)/index.tsx`) exibe **todos** os produtos em grid, sem nenhuma forma de recorte. Os produtos já referenciam uma categoria no domínio (`Product.categoryId: string`, que aponta para um `Category` em `src/types`), e o catálogo mockado (`src/data/products.ts`) cobre múltiplas categorias — mas essa informação não é aproveitada na navegação.

Queremos adicionar uma faixa horizontal de chips de categoria no topo do grid. Ao tocar em um chip, o grid passa a exibir somente os produtos daquela categoria. Deve existir uma opção "Todas" (ou equivalente) que limpa o filtro e volta ao estado completo. O filtro selecionado precisa ficar visualmente destacado.

A lista de categorias deve ser **derivada dos dados** (categorias distintas presentes em `products.ts`), não hard-coded numa tela, para que novos produtos/categorias apareçam automaticamente.

### Notas de design (feedforward)
- Telas envolvidas por `SafeAreaView` (react-native-safe-area-context); manter o padrão do `_layout` raiz.
- Estilização exclusivamente com `styled-components/native` (sem `StyleSheet.create` solto). Componente estilizado nomeado (ex.: `CategoryChip`, `ChipRow`).
- Estado de seleção é local da tela (UI), não precisa ir para o store global do carrinho.
- `camelCase` para variáveis/funções; `PascalCase` para componentes e arquivos de componente.

## Critérios de aceite (verificáveis)

- [ ] Ao abrir o catálogo, uma faixa de chips de categoria aparece acima do grid, incluindo a opção "Todas".
- [ ] A lista de chips é derivada das categorias distintas existentes em `src/data/products.ts` (adicionar um produto de categoria nova faz surgir o chip correspondente, sem editar a tela).
- [ ] Tocar num chip de categoria exibe **apenas** os produtos cujo `categoryId` corresponde ao chip; nenhum produto de outra categoria permanece visível.
- [ ] Com "Todas" selecionado (estado inicial), o grid mostra todos os produtos do catálogo.
- [ ] O chip atualmente selecionado tem destaque visual distinto dos demais.
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam (tipos do filtro sem `any`).

### Dica de teste
Em `tests/`, montar o catálogo com RNTL, simular `press` no chip de uma categoria conhecida e assertar que `queryByText` de um produto de outra categoria retorna `null`, enquanto os produtos esperados continuam visíveis. Cobrir também o retorno ao estado "Todas".

## Arquivos prováveis afetados

- `app/(tabs)/index.tsx` — renderiza a faixa de chips + grid filtrado.
- `src/components/CategoryChip.tsx` — **novo** componente estilizado do chip.
- `src/hooks/useProducts.ts` — possível seletor de categorias distintas / produtos filtrados.
- `src/types/` — reuso de `Category` (sem mudança esperada de contrato).
- `tests/` — **novo** teste de aceite do filtro.
