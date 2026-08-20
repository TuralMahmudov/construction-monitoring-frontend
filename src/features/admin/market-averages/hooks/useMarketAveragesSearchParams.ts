import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { VariabilityLevelParam } from '../types/priceAverage.types';

export interface MarketAveragesSearchParamsPatch {
  name?: string;
  categoryId?: string;
  regionId?: string;
  variabilityLevel?: VariabilityLevelParam;
  page?: number;
  size?: number;
}

export interface ResolvedMarketAveragesSearchParams {
  name?: string;
  categoryId?: string;
  regionId?: string;
  variabilityLevel?: VariabilityLevelParam;
  page: number;
  size: number;
}

const VARIABILITY_VALUES: VariabilityLevelParam[] = ['STABLE', 'MODERATE', 'HIGH'];

// Same pattern as useProductSearchParams/useResourceSearchParams/
// useCategorySearchParams — filter state lives in the URL so a refresh,
// shared link, or browser back/forward all preserve it, not local state.
export function useMarketAveragesSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ResolvedMarketAveragesSearchParams = useMemo(() => {
    const rawVariability = searchParams.get('variabilityLevel');
    return {
      name: searchParams.get('name') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      regionId: searchParams.get('regionId') ?? undefined,
      variabilityLevel: VARIABILITY_VALUES.includes(rawVariability as VariabilityLevelParam)
        ? (rawVariability as VariabilityLevelParam)
        : undefined,
      page: Number(searchParams.get('page') ?? 0),
      size: Number(searchParams.get('size') ?? 25),
    };
  }, [searchParams]);

  const updateParams = useCallback(
    (patch: MarketAveragesSearchParamsPatch) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        // Any filter change re-starts pagination at page 0 — an explicit
        // page change in the same patch (DataGrid's own pagination) wins.
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
