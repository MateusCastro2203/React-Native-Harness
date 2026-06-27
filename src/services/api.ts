import type { Category, Product } from '../types';
import { CATEGORIES, PRODUCTS } from '../data/products';

// Fake API SEM backend: simula latência de rede e pode falhar, para que os
// hooks exercitem estados reais de loading/error (ver specs/project.md §2).
// Os hooks (src/hooks) consomem estas funções e expõem { data, loading, error }.

/** Janela de latência simulada (ms). */
const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 600;

/**
 * Probabilidade de falha simulada por chamada (0–1). Padrão 0 (determinístico
 * para a base/testes). Ajustável em runtime via setApiFailureRate para
 * exercitar o caminho de erro na UI.
 */
let failureRate = 0;

/** Define a taxa de falha simulada (0–1). Usado em demos/manuais, não em testes. */
export function setApiFailureRate(rate: number): void {
  failureRate = Math.min(1, Math.max(0, rate));
}

function randomLatency(): number {
  return MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
}

/** Resolve `value` após latência simulada; rejeita conforme `failureRate`. */
function withLatency<T>(value: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failureRate) {
        reject(new Error('Network request failed (simulated)'));
        return;
      }
      resolve(value);
    }, randomLatency());
  });
}

/** Retorna o catálogo completo de produtos. */
export function getProducts(): Promise<Product[]> {
  return withLatency([...PRODUCTS]);
}

/** Retorna um produto pelo id, ou undefined se não existir. */
export function getProductById(id: string): Promise<Product | undefined> {
  return withLatency(PRODUCTS.find((product) => product.id === id));
}

/** Retorna a lista de categorias. */
export function getCategories(): Promise<Category[]> {
  return withLatency([...CATEGORIES]);
}
