# Log de decisão (EXEMPLO) — DEMO-1

> **Artefato ilustrativo.** Este arquivo mostra o formato dos logs que o `/resolve DEMO-1`
> grava em runtime (`.claude/logs/DEMO-1-<round>.md`) e a saída **real** capturada ao validar
> o mecanismo vermelho→verde. Foi gerado fora do palco para servir de referência; durante a
> palestra os logs aparecem ao vivo, um por volta do loop `evaluator ↔ implementer`.
>
> A base do repositório **continua com o bug plantado** (este teste e a correção foram
> revertidos após a validação). Veja `specs/tickets/DEMO-1.md`.

---

## Volta 1 — evaluator → FAIL

| Campo | Valor |
|-------|-------|
| **Ticket** | DEMO-1 |
| **Etapa** | evaluator |
| **Volta** | 1 / 3 |
| **Timestamp** | 2026-06-26 (exemplo) |
| **Fonte do ticket** | specs/tickets/DEMO-1.md (fallback local) |

**Ação avaliada:** `implementer` adicionou o teste de aceite `tests/cart.coupon.test.ts`
(vindo do spec) e, no primeiro passe, refletiu o cupom apenas no subtotal exibido —
`total()` ainda ignora o desconto (bug plantado da base).

### Sensores

`npm run typecheck` → **PASS** (tsc --noEmit, exit 0)
`npm run lint` → **PASS** (eslint ., exit 0)
`npm run test` → **FAIL** (exit 1):

```
FAIL tests/cart.coupon.test.ts
  DEMO-1 — apply coupon discount to cart total
    ✕ applies a valid coupon percentage to the TOTAL (not just the subtotal)
    ✓ does not change the total for an invalid coupon code
    ✕ restores the total when the coupon is removed

  ● … › applies a valid coupon percentage to the TOTAL (not just the subtotal)

    expect(received).toBe(expected) // Object.is equality
    Expected: 225
    Received: 250
    > 53 |     expect(useCartStore.getState().total()).toBe(225);

  ● … › restores the total when the coupon is removed

    expect(received).toBe(expected) // Object.is equality
    Expected: 90
    Received: 100
    > 81 |     expect(useCartStore.getState().total()).toBe(90);

Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
```

- **Veredito:** ❌ FAIL
- **Motivo (devolvido ao implementer):** `total()` não aplica o desconto do cupom.
  Esperado `225` (250 − 10%), recebido `250`; e `90` (100 − 10%), recebido `100`. O cupom
  válido é armazenado, mas o cálculo do total o ignora.
- **Decisão do orquestrador:** REPETIR — devolver ao `implementer` com o motivo (volta 2 / 3).

---

## Volta 2 — evaluator → PASS

| Campo | Valor |
|-------|-------|
| **Ticket** | DEMO-1 |
| **Etapa** | evaluator |
| **Volta** | 2 / 3 |
| **Timestamp** | 2026-06-26 (exemplo) |

**Ação avaliada:** `implementer` autocorrigiu `total()` para aplicar o desconto sobre o
subtotal: `total = subtotal - round(subtotal * discountPercent / 100)` (piso em 0).

### Sensores

`npm run typecheck` → **PASS** (exit 0)
`npm run lint` → **PASS** (exit 0)
`npm run test` → **PASS** (exit 0):

```
PASS tests/cart.coupon.test.ts
  DEMO-1 — apply coupon discount to cart total
    ✓ applies a valid coupon percentage to the TOTAL (not just the subtotal)
    ✓ does not change the total for an invalid coupon code
    ✓ restores the total when the coupon is removed

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

- **Veredito:** ✅ PASS
- **Decisão do orquestrador:** AVANÇAR para o `reviewer` (parecer inferencial) e, em seguida,
  commit + PR (gated por `--pr`).

---

## Parecer do reviewer (exemplo)

**APROVADO COM RESSALVAS.** O cálculo do total agora é coerente e arredonda para centavos
inteiros (sem erro de ponto flutuante). Aderência às convenções OK (tipagem forte, lógica no
store). Ressalva menor: a UI de inserir o código de cupom poderia exibir feedback de cupom
inválido. Não bloqueante para o aceite.
