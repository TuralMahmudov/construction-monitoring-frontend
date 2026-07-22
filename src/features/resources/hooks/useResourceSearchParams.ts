import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ResourceSearchParams } from '../types/resource.types';

export type ResolvedResourceSearchParams = Required<Pick<ResourceSearchParams, 'page' | 'size'>> &
  Pick<
    ResourceSearchParams,
    'name' | 'code' | 'category' | 'manufacturer' | 'brand' | 'unit' | 'status' | 'sort'
  >;

export function useResourceSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ResolvedResourceSearchParams = useMemo(
    () => ({
      name: searchParams.get('name') ?? undefined,
      code: searchParams.get('code') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      manufacturer: searchParams.get('manufacturer') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      unit: searchParams.get('unit') ?? undefined,
      status: searchParams.get('status') === null ? undefined : searchParams.get('status') === 'true',
      sort: searchParams.get('sort') ?? undefined,
      page: Number(searchParams.get('page') ?? 0),
      size: Number(searchParams.get('size') ?? 10),
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (patch: Partial<ResourceSearchParams>) => {
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
