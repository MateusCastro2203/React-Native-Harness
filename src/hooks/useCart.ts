import { useCartStore } from '../store/cart.store';
import type { CartItem, Coupon, Product } from '../types';

// Selectors convenientes do carrinho para as telas. Lê o estado e as ações do
// store Zustand; expõe valores derivados já resolvidos (itemCount, subtotal,
// total) e as ações. Ver CLAUDE.md (selectors via hooks em src/hooks).

interface UseCartResult {
  items: CartItem[];
  coupon: Coupon | null;
  itemCount: number;
  subtotal: number;
  total: number;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

/** Hook de conveniência: estado + selectors derivados + ações do carrinho. */
export function useCart(): UseCartResult {
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);

  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const updateQty = useCartStore((state) => state.updateQty);
  const clear = useCartStore((state) => state.clear);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const itemCount = useCartStore((state) => state.itemCount());
  const subtotal = useCartStore((state) => state.subtotal());
  const total = useCartStore((state) => state.total());

  return {
    items,
    coupon,
    itemCount,
    subtotal,
    total,
    add,
    remove,
    updateQty,
    clear,
    applyCoupon,
    removeCoupon,
  };
}
