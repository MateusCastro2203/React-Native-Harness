import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProductById, getProducts } from '../services/api';

// Hooks que consomem a fake API e expõem o contrato de loading/error usado
// pelas telas (catálogo e detalhe). `reload` reexecuta a busca (útil no retry
// do estado de erro). Ver specs/project.md §2 e §5.

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

interface UseProductResult {
  product: Product | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/** Lista de produtos do catálogo, com estados de loading/error e reload. */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { products, loading, error, reload: load };
}

/** Um produto pelo id, com estados de loading/error e reload. */
export function useProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProductById(id)
      .then((data) => {
        if (active) {
          setProduct(data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  return { product, loading, error, reload: load };
}
