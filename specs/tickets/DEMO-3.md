# DEMO-3 — Busca por nome de produto

> **Tipo:** História · **Épico:** Catálogo & Descoberta · **Prioridade:** Média
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-3`). Este ticket **descreve** a feature; não a implementa.

## Resumo

Como pessoa usuária, quero digitar parte do nome de um produto na aba de Busca e ver a lista filtrar em tempo real, para localizar um item específico sem depender de categorias.

## Descrição

A aba de Busca (`app/(tabs)/search.tsx`) existe na navegação por tabs (Catálogo · Busca · Carrinho), mas ainda não tem a lógica de busca textual. Precisamos de um campo de texto no topo que, conforme a pessoa digita, filtre a lista de produtos pelo `name`.

Regras da busca:
- Correspondência **parcial** e **case-insensitive** (digitar "ten" encontra "Tênis Runner").
- Idealmente **insensível a acentos** (digitar "tenis" encontra "Tênis") — desejável; se custar muito, documentar a decisão no PLAN do planner.
- Campo vazio mostra **todos** os produtos (ou um estado inicial neutro consistente).
- Quando nenhum produto casar com o termo, exibir um **estado vazio** com mensagem clara (ex.: "Nenhum produto encontrado para …").

A busca opera sobre os dados mockados (`src/data/products.ts`) via a fake API/hook existente; não há backend. Como o serviço simula latência (`src/services/api.ts`), o filtro em si deve ser sobre a lista já carregada (filtragem client-side), não um novo request por tecla.

### Notas de design (feedforward)
- `SafeAreaView` envolvendo a tela; padrão do `_layout` raiz mantido.
- `styled-components/native` para o `SearchInput`, a lista e o estado vazio (sem `StyleSheet.create` solto).
- Estado do termo é local da tela (`useState`); não vai para o store global.
- `camelCase`/`PascalCase` conforme convenção; hooks `useX.ts`.

## Critérios de aceite (verificáveis)

- [ ] A aba de Busca exibe um campo de texto no topo.
- [ ] Digitar um termo filtra a lista para os produtos cujo `name` contém o termo (correspondência parcial, case-insensitive).
- [ ] Apagar o termo (campo vazio) retorna a lista ao conjunto completo.
- [ ] Um termo sem correspondência exibe o estado vazio com mensagem, sem quebrar a tela.
- [ ] A filtragem é client-side sobre a lista carregada (não dispara um request da fake API por caractere).
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam.

### Dica de teste
Em `tests/`, renderizar a tela de Busca, usar `fireEvent.changeText` no input com um termo parcial e assertar que só os produtos esperados aparecem (`getByText`) e os demais somem (`queryByText` → `null`). Cobrir o caso do estado vazio com um termo improvável e o retorno ao limpar o campo.

## Arquivos prováveis afetados

- `app/(tabs)/search.tsx` — campo de busca + lista filtrada + estado vazio.
- `src/components/SearchInput.tsx` — **novo** input estilizado.
- `src/components/EmptyState.tsx` — **novo** (ou reuso) para o "nenhum resultado".
- `src/hooks/useProducts.ts` — possível seletor/util de filtragem por termo.
- `tests/` — **novo** teste de aceite da busca.
