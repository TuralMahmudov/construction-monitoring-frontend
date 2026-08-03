import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getResourceById } from '../api/resourcesApi';
import type { Resource } from '../types/resource.types';

/**
 * Per-id resource lookup for screens that only receive raw resourceIds
 * (e.g. the flagged-prices review queue) — there's no batch-by-ids endpoint,
 * so each unique id on the current page gets its own GET.
 */
export function useResourceLookup(ids: string[]) {
  const uniqueIds = useMemo(() => Array.from(new Set(ids)), [ids]);

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['resources', 'lookup', id] as const,
      queryFn: () => getResourceById(id),
      staleTime: 5 * 60_000,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, Resource>();
    queries.forEach((query) => {
      if (query.data) {
        map.set(query.data.id, query.data);
      }
    });
    return map;
  }, [queries]);
}
