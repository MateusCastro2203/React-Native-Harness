# DEMO-1 — Aplicar cupom de desconto no carrinho

> Espelho local do ticket Jira (fonte de fallback do `/resolve DEMO-1` quando o Atlassian MCP estiver indisponível).
> Prosa em PT-BR; código, tipos, identificadores e mensagens de commit em EN.

| Campo | Valor |
|-------|-------|
| **Chave** | DEMO-1 |
| **Tipo** | Story |
| **Épico** | Carrinho |
| **Status** | A Fazer |
| **Prioridade** | Alta |
| **Labels** | `cart`, `coupon`, `demo` |
| **Responsável** | (a definir pelo `/resolve`) |

---

## Resumo

Aplicar cupom de desconto no carrinho.

---

## Descrição

Como pessoa usuária do carrinho, quero inserir um código de cupom para que um percentual
de desconto seja aplicado ao **valor total** da minha compra.

O carrinho expõe hoje um `subtotal` (soma dos itens) e um `total` (valor final a pagar).
A feature deve permitir digitar um código de cupom, validá-lo contra os cupons conhecidos e,
quando válido, refletir o percentual de desconto **no `total`** — não apenas em algum valor
exibido de forma intermediária. Códigos inválidos não podem alterar nenhum valor. Remover o
cupom precisa restaurar o `total` ao valor sem desconto.

Cupons conhecidos para esta entrega:

| Código | Tipo | Valor |
|--------|------|-------|
| `SAVE10` | percentual | 10% |

A regra de cálculo do total com desconto é determinística (o `Coupon` guarda
`discountPercent` em escala 0–100; o desconto é arredondado para centavos inteiros, conforme
`specs/project.md` §3.4):

```
total = subtotal - round(subtotal * coupon.discountPercent / 100)
```

Sem cupom aplicado, `total === subtotal` (ignorando aqui frete e demais ajustes, que são
escopo de outros tickets).

---

## Critérios de aceite (verificáveis)

1. **Cupom válido aplica desconto ao TOTAL.**
   Dado um carrinho com itens cujo `subtotal` é conhecido, quando `applyCoupon("SAVE10")`
   é chamado, então o `total` passa a ser `subtotal * 0.9` (10% de desconto sobre o total),
   e não apenas o subtotal exibido.

2. **Cupom inválido não altera o total.**
   Dado um carrinho com um `total` conhecido, quando `applyCoupon("INVALIDO")` é chamado,
   então nenhum cupom é armazenado e o `total` permanece igual ao valor sem desconto
   (`total === subtotal`).

3. **Remover o cupom restaura o total.**
   Dado um carrinho com `SAVE10` aplicado (total já descontado), quando `removeCoupon()` é
   chamado, então o cupom é removido e o `total` volta a ser igual ao `subtotal`.

> Observação de aceite: o `subtotal` é a soma bruta dos itens e **não** muda ao aplicar o
> cupom — quem reflete o desconto é o `total`. Assertar contra o `subtotal` não satisfaz o
> critério 1.

---

## Contrato de teste (aceite)

Adicionar **exatamente** o teste abaixo em `tests/cart.coupon.test.ts` (novo arquivo — a
base não contém teste de cupom, por isso o estado inicial fica verde). Ele importa o cart
store, adiciona itens, aplica o cupom válido `SAVE10` (10%) e **assere o `total` com desconto**
(não o `subtotal`). O teste é determinístico: usa preços fixos e reseta o store antes de cada
caso.

```typescript
import { act } from '@testing-library/react-native';
import { useCartStore } from '../src/store/cart.store';
import type { Product } from '../src/types';

const productA: Product = {
  id: 'p1',
  name: 'Keyboard',
  description: 'Mechanical keyboard',
  price: 100,
  categoryId: 'peripherals',
  imageUrl: 'https://example.com/p1.png',
  inStock: true,
};

const productB: Product = {
  id: 'p2',
  name: 'Mouse',
  description: 'Wireless mouse',
  price: 50,
  categoryId: 'peripherals',
  imageUrl: 'https://example.com/p2.png',
  inStock: true,
};

const resetCart = () => {
  act(() => {
    useCartStore.getState().clear();
    useCartStore.getState().removeCoupon();
  });
};

describe('DEMO-1 — apply coupon discount to cart total', () => {
  beforeEach(() => {
    resetCart();
  });

  it('applies a valid coupon percentage to the TOTAL (not just the subtotal)', () => {
    act(() => {
      useCartStore.getState().add(productA); // 1 x 100
      useCartStore.getState().add(productA); // +1 -> 2 x 100 = 200
      useCartStore.getState().add(productB); // 1 x 50  =  50
    });

    // subtotal is the raw sum of items
    expect(useCartStore.getState().subtotal()).toBe(250);

    act(() => {
      useCartStore.getState().applyCoupon('SAVE10');
    });

    // SAVE10 = discountPercent 10, applied to the TOTAL
    // total = 250 - round(250 * 10 / 100) = 250 - 25 = 225
    expect(useCartStore.getState().total()).toBe(225);

    // subtotal must stay untouched by the coupon
    expect(useCartStore.getState().subtotal()).toBe(250);
  });

  it('does not change the total for an invalid coupon code', () => {
    act(() => {
      useCartStore.getState().add(productA); // 100
    });

    act(() => {
      useCartStore.getState().applyCoupon('INVALID_CODE');
    });

    expect(useCartStore.getState().coupon).toBeNull();
    expect(useCartStore.getState().total()).toBe(100);
    expect(useCartStore.getState().total()).toBe(
      useCartStore.getState().subtotal(),
    );
  });

  it('restores the total when the coupon is removed', () => {
    act(() => {
      useCartStore.getState().add(productA); // 100
      useCartStore.getState().applyCoupon('SAVE10'); // total -> 90
    });

    expect(useCartStore.getState().total()).toBe(90);

    act(() => {
      useCartStore.getState().removeCoupon();
    });

    expect(useCartStore.getState().coupon).toBeNull();
    expect(useCartStore.getState().total()).toBe(100);
    expect(useCartStore.getState().total()).toBe(
      useCartStore.getState().subtotal(),
    );
  });
});
```

> Contrato de pronto para o `evaluator`: este arquivo de teste é o sensor de aceite do
> DEMO-1. `npm run typecheck`, `npm run lint` e `npm run test` devem passar **com este teste
> presente** antes do veredito PASS.

---

## Plano de sprint incremental

A implementação deve ser feita em dois passes pequenos, propositadamente — isso evidencia o
ponto exato onde o `evaluator` reprova e força a autocorreção.

- **Sprint 1 — refletir o cupom no subtotal exibido.**
  Armazenar o cupom validado no store e refletir o desconto **apenas no subtotal exibido na
  UI**. Aparentemente "funciona" na tela, mas o `total()` continua somando o valor cheio.
  *É aqui que o teste de aceite fica VERMELHO:* o critério 1 assere `total() === 225`,
  enquanto o código ainda devolve `250`. O `evaluator` reprova com a assertion exata
  (`expect(received).toBe(expected)` → `Expected: 225 / Received: 250`).

- **Sprint 2 — aplicar o desconto ao total.**
  Corrigir `total()` para aplicar o percentual do cupom sobre o subtotal
  (`total = subtotal - round(subtotal * coupon.discountPercent / 100)`). O teste de aceite
  fica VERDE. `removeCoupon()` zera o cupom e restaura `total() === subtotal()`.

Sequência observável nos logs (`.claude/logs/DEMO-1-<round>.md`):
VERMELHO (round 1, total errado) → autocorreção do `implementer` → VERDE (round 2).

---

## NOTA DE DEMO

Este ticket é o **momento-chave da palestra** (vermelho → autocorreção → verde).

A base do projeto já contém um `applyCoupon` **deliberadamente incompleto** (bug plantado) em
`src/store/cart.store.ts`: ele guarda o cupom e desconta **apenas o subtotal exibido**, deixando
o `total` errado. O **teste de aceite acima NÃO existe na base** — por isso o estado inicial do
repositório fica VERDE (os sensores passam, ninguém valida o total ainda).

No `/resolve DEMO-1`, a sequência demonstrada ao vivo é determinística:

1. O `implementer` adiciona o teste de aceite vindo deste spec (`tests/cart.coupon.test.ts`).
2. `npm run test` fica **VERMELHO** contra o `applyCoupon` bugado (total = 250, esperado 225).
3. O `evaluator` reprova (FAIL) e devolve a assertion exata como motivo.
4. O `implementer` autocorrige `total()` para aplicar o desconto ao total.
5. `npm run test` fica **VERDE**; o `evaluator` aprova (PASS).

O bug plantado garante o vermelho no palco; o spec garante que lê como workflow real.

> Este ticket é apenas a **especificação e o teste de aceite**. A implementação da feature
> (UI de inserir código, validação do cupom, correção do `total`) é produzida pelo workflow
> `/resolve DEMO-1` — não deve ser escrita aqui.
