// Unit tests for the cart store LOGIC (Zustand). Coupon/discount behavior is
// intentionally NOT covered here — that is ticket DEMO-1 (planted bug in
// `total()`), and testing it would fail on the base. These tests target the
// raw cart math and item lifecycle, which must be GREEN on the base.

import { act } from '@testing-library/react-native';
import { useCartStore } from '../src/store/cart.store';
import type { Product } from '../src/types';

// Test products. `price` is in CENTS (integers), matching the domain contract.
const keyboard: Product = {
  id: 'p1',
  name: 'Mechanical Keyboard',
  description: 'Tactile mechanical keyboard',
  price: 34900,
  categoryId: 'peripherals',
  imageUrl: 'https://picsum.photos/seed/p1/400/400',
  inStock: true,
};

const mouse: Product = {
  id: 'p2',
  name: 'Wireless Mouse',
  description: 'Ergonomic wireless mouse',
  price: 14900,
  categoryId: 'peripherals',
  imageUrl: 'https://picsum.photos/seed/p2/400/400',
  inStock: true,
};

beforeEach(() => {
  // Reset the global store to a clean state before every test.
  act(() => {
    useCartStore.getState().clear();
    useCartStore.getState().removeCoupon();
  });
});

describe('cart store logic', () => {
  it('starts empty: subtotal() === 0 and total() === 0', () => {
    const cart = useCartStore.getState();
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal()).toBe(0);
    expect(cart.total()).toBe(0);
  });

  it('add() creates a line with quantity 1', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.product.id).toBe('p1');
    expect(items[0]?.quantity).toBe(1);
  });

  it('add() of the same product increments its quantity', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(keyboard);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(3);
  });

  it('add() of a different product creates a separate line', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(mouse);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(useCartStore.getState().itemCount()).toBe(2);
  });

  it('subtotal() is the raw sum of price * quantity across lines', () => {
    act(() => {
      useCartStore.getState().add(keyboard); // 34900 x1
      useCartStore.getState().add(mouse); // 14900
      useCartStore.getState().add(mouse); // 14900 -> qty 2
    });

    // 34900 + (14900 * 2) = 64700
    expect(useCartStore.getState().subtotal()).toBe(64700);
  });

  it('updateQty() sets the quantity of a line', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().updateQty('p1', 5);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
    expect(useCartStore.getState().subtotal()).toBe(34900 * 5);
  });

  it('updateQty() with quantity <= 0 removes the line', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(mouse);
      useCartStore.getState().updateQty('p1', 0);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.product.id).toBe('p2');
  });

  it('updateQty() with a negative quantity removes the line', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().updateQty('p1', -3);
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('remove(productId) removes the matching line', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(mouse);
      useCartStore.getState().remove('p1');
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.product.id).toBe('p2');
  });

  it('clear() empties the cart', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(mouse);
      useCartStore.getState().clear();
    });

    const cart = useCartStore.getState();
    expect(cart.items).toHaveLength(0);
    expect(cart.itemCount()).toBe(0);
    expect(cart.subtotal()).toBe(0);
  });

  it('without a coupon, total() equals subtotal()', () => {
    act(() => {
      useCartStore.getState().add(keyboard);
      useCartStore.getState().add(mouse);
    });

    const cart = useCartStore.getState();
    expect(cart.coupon).toBeNull();
    expect(cart.total()).toBe(cart.subtotal());
  });
});
