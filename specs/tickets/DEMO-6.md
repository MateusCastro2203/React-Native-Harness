# DEMO-6 — Frete grátis acima de R$199, exibido no carrinho

> **Tipo:** História · **Épico:** Carrinho · **Prioridade:** Alta
> **Espelho do Jira** (fonte de fallback do `/resolve DEMO-6`). Este ticket **descreve** a feature; não a implementa.

## Resumo

Como pessoa usuária, quero pagar **frete grátis** quando minha compra ultrapassa um valor mínimo, e ver no carrinho quanto falta para atingir esse benefício, para ser incentivada a completar o pedido.

## Descrição

O carrinho (`app/(tabs)/cart.tsx`) hoje calcula `subtotal` e `total` no store (`src/store/cart.store.ts`), mas não tem o conceito de **frete**. Vamos introduzir uma regra de frete com limite de frete grátis:

- **Limiar de frete grátis:** **R$199,00** (definido neste ticket). Centralizar como constante nomeada (ex.: `FREE_SHIPPING_THRESHOLD`) — não espalhar o número mágico pelas telas. Como todo valor monetário no domínio é em **centavos** (inteiro — ver `specs/project.md` §2), a constante vale `19900`; a formatação para `R$199,00` ocorre só na UI (componente `Price`).
- **Valor do frete padrão:** um custo fixo de frete (ex.: `R$19,90` → `1990` em centavos) aplicado quando o subtotal está **abaixo** do limiar. Centralizar como constante (ex.: `DEFAULT_SHIPPING`).
- A comparação é feita sobre o **subtotal** dos itens (antes de eventual cupom do DEMO-1, salvo decisão contrária registrada no PLAN do planner).

Comportamento no carrinho:
- Subtotal **≥ R$199,00** → frete exibido como **"Grátis"** (R$0,00) e não somado ao total.
- Subtotal **< R$199,00** → frete cobrado (valor padrão) e somado ao total; exibir uma mensagem de progresso do tipo **"Faltam R$ X para o frete grátis"**, onde `X = limiar − subtotal`.
- Carrinho vazio: não exibir a regra de frete (ou exibir estado neutro consistente).
- O **total** do carrinho deve refletir o frete: `total = subtotal + frete` (e, quando o cupom existir, compor corretamente — ver DEMO-1).

A lógica de frete deve viver no domínio (store/selector), não na renderização da tela, para ser testável isoladamente.

### Notas de design (feedforward)
- `SafeAreaView` no carrinho; linhas de resumo (subtotal / frete / total) com `styled-components/native` (sem `StyleSheet.create` solto).
- Constantes e tipos em `src/types`/`src/data` ou módulo de regras; `camelCase` para funções, `UPPER_SNAKE_CASE` apenas para as constantes de configuração.
- Evitar número mágico: limiar e valor de frete centralizados e referenciados por nome.

## Critérios de aceite (verificáveis)

- [ ] Com subtotal **≥ R$199,00**, o carrinho exibe o frete como "Grátis" e o frete **não** é somado ao total.
- [ ] Com subtotal **< R$199,00**, o carrinho exibe o valor de frete padrão e ele **é** somado ao total.
- [ ] Abaixo do limiar, o carrinho mostra "Faltam R$ X para o frete grátis", com `X = 199 − subtotal` formatado em BRL.
- [ ] O limiar (R$199,00) e o valor do frete padrão são constantes nomeadas, sem número mágico repetido nas telas.
- [ ] O `total` exibido é igual a `subtotal + frete` (compondo corretamente com o cupom do DEMO-1 quando aplicável).
- [ ] `npm run typecheck`, `npm run lint` e `npm run test` passam.

### Dica de teste
Em `tests/`, testar a função/selector de frete em três pontos: subtotal logo **abaixo** de 199 (frete cobrado + "faltam R$ X" correto), exatamente **199** (limite → grátis) e **acima** de 199 (grátis). Assertar também que `total === subtotal + frete` em cada caso.

## Arquivos prováveis afetados

- `src/store/cart.store.ts` — cálculo de frete e composição no `total`.
- `src/hooks/` — selector de frete / faltam-para-grátis (ex.: `useShipping`).
- `app/(tabs)/cart.tsx` — linhas de resumo com frete + mensagem de progresso.
- `src/types/` — possível tipo de resumo de frete; constantes `FREE_SHIPPING_THRESHOLD`/`DEFAULT_SHIPPING`.
- `tests/` — **novo** teste da regra de frete.
