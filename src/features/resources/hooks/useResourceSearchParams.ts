import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ResourceSearchParams } from '../types/resource.types';

export type ResolvedResourceSearchParams = Required<Pick<ResourceSearchParams, 'page' | 'size'>> &
  Pick<ResourceSearchParams, 'product' | 'organization' | 'active' | 'sort'>;

export function useResourceSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ResolvedResourceSearchParams = useMemo(
    () => ({
      product: searchParams.get('product') ?? undefined,
      organization: searchParams.get('organization') ?? undefined,
      active: searchParams.get('active') === null ? undefined : searchParams.get('active') === 'true',
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
