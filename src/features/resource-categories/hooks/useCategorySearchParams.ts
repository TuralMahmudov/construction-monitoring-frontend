import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CategorySearchParams, CategoryStatusFilter } from '../types/resourceCategory.types';

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;
const DEFAULT_SORT_BY = 'name';
const DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'asc';

function parseStatus(value: string | null): CategoryStatusFilter {
  return value === 'ACTIVE' || value === 'INACTIVE' ? value : 'ALL';
}

export type ResolvedCategorySearchParams = Required<
  Pick<CategorySearchParams, 'page' | 'size' | 'sortBy' | 'sortDirection' | 'status'>
> &
  Pick<CategorySearchParams, 'name' | 'code' | 'type'>;

export function useCategorySearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ResolvedCategorySearchParams = useMemo(
    () => ({
      name: searchParams.get('name') ?? undefined,
      code: searchParams.get('code') ?? undefined,
      status: parseStatus(searchParams.get('status')),
      type: searchParams.get('type') ? Number(searchParams.get('type')) : undefined,
      page: Number(searchParams.get('page') ?? DEFAULT_PAGE),
      size: Number(searchParams.get('size') ?? DEFAULT_SIZE),
      sortBy: searchParams.get('sortBy') ?? DEFAULT_SORT_BY,
      sortDirection: searchParams.get('sortDirection') === 'desc' ? 'desc' : DEFAULT_SORT_DIRECTION,
    }),
    [searchParams],
  );

  const updateParams = useCallback(
    (patch: Partial<CategorySearchParams>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        // Any filter/sort change resets pagination back to the first page,
        // unless the page itself is what's being changed.
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
