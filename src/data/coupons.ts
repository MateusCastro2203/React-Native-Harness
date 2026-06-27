import type { Coupon } from '../types';

// Cupons conhecidos da loja. `applyCoupon` do store valida o código digitado
// contra esta lista (DEMO-1). `discountPercent` na escala 0–100.
export const KNOWN_COUPONS: Coupon[] = [
  { code: 'SAVE10', discountPercent: 10, description: '10% off' },
];
