import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductSearchParams } from '../types/product.types';

export type ResolvedProductSearchParams = Required<Pick<ProductSearchParams, 'page' | 'size'>> &
  Pick<ProductSearchParams, 'category' | 'name' | 'code' | 'unit' | 'active' | 'sort'>;

export function useProductSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ResolvedProductSearchParams = useMemo(
    () => ({
      category: searchParams.get('category') ?? undefined,
      name: searchParams.get('name') ?? undefined,
      code: searchParams.get('code') ?? undefined,
      unit: searchParams.get('unit') ?? undefined,
      active: searchParams.get('active') === null ? undefined : searchParams.get('active') === 'true',
      sort: searchParams.get('sort') ?? undefined,
      page: Number(searchParams.get('page') ?? 0),
      size: Number(searchParams.get('size') ?? 10),
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (patch: Partial<ProductSearchParams>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        if (!('page' in patch)) {
          next.set('page', '0');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  return { params, updateParams };
}
