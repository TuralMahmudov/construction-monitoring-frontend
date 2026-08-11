import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getProductById } from '../api/productsApi';
import type { Product } from '../types/product.types';
import { productKeys } from './queryKeys';

/**
 * Per-id product lookup for screens that only receive raw productIds (e.g.
 * market-price averages, which aggregate across orgs and can't embed a
 * single org's resource) — mirrors resources/hooks/useResourceLookup.ts,
 * same no-batch-endpoint rationale.
 */
export function useProductLookup(ids: string[]) {
  const uniqueIds = useMemo(() => Array.from(new Set(ids)), [ids]);

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: productKeys.detail(id),
      queryFn: () => getProductById(id),
      staleTime: 5 * 60_000,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, Product>();
    queries.forEach((query) => {
      if (query.data) {
        map.set(query.data.id, query.data);
      }
    });
    return map;
  }, [queries]);
}
