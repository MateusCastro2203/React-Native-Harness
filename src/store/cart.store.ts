import { create } from 'zustand';
import type { CartItem, Coupon, Product } from '../types';
import { KNOWN_COUPONS } from '../data/coupons';

// Estado global do carrinho (Zustand). Toda a lógica de valores em CENTAVOS
// (inteiros). Selectors derivados (`subtotal`, `total`, `itemCount`) expostos
// como FUNÇÕES — coerente com o uso `useCartStore.getState().total()` nos
// testes de aceite (ver specs/project.md §3).

export interface CartState {
  items: CartItem[];
  coupon: Coupon | null;

  // Ações
  add: (product: Product) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;

  // Selectors derivados (funções)
  itemCount: () => number;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  coupon: null,

  add: (product) =>
    set((state) => {
      const existing = state.items.find(
        (item) => item.product.id === product.id,
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),

  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),

  updateQty: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.product.id !== productId),
        };
      }
      return {
        items: state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      };
    }),

  clear: () => set({ items: [] }),

  applyCoupon: (code) =>
    set(() => {
      const match = KNOWN_COUPONS.find((coupon) => coupon.code === code);
      // Cupom válido => guarda o Coupon; inválido => coupon permanece null.
      return { coupon: match ?? null };
    }),

  removeCoupon: () => set({ coupon: null }),

  itemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),

  // Soma crua dos itens, em centavos. NUNCA é afetado pelo cupom.
  subtotal: () =>
    get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),

  // BUG PLANTADO (DEMO-1): total() devolve exatamente o subtotal e IGNORA o
  // cupom — não subtrai o desconto. O `/resolve DEMO-1` corrige isto no futuro
  // (total = subtotal - round(subtotal * discountPercent / 100)). Não consertar
  // aqui: o vermelho determinístico do demo depende deste bug.
  total: () => get().subtotal(),
}));
