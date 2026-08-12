import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { searchResources } from '../../resources/api/resourcesApi';
import { resourceKeys } from '../../resources/hooks/queryKeys';

// Per-document resource count for the "Daxil olanlar" table's "Resurs
// sayı" column. `size: 1` keeps each response tiny — only `totalElements`
// is read, the single row itself is discarded. Separate cache entry from
// DocumentResourcesViewDialog's own (larger, size: 200) fetch — opening
// "Bax" still does its own request, this is just the lightweight count.
export function useDocumentResourceCounts(documentIds: string[]) {
  const uniqueIds = useMemo(() => Array.from(new Set(documentIds)), [documentIds]);

  const queries = useQueries({
    queries: uniqueIds.map((documentId) => {
      const params = { documentId, size: 1, sort: 'createdDate,desc' };
      return {
        queryKey: resourceKeys.search(params),
        queryFn: () => searchResources(params),
        staleTime: 30_000,
      };
    }),
  });

  return useMemo(() => {
    const map = new Map<string, number>();
    uniqueIds.forEach((id, index) => {
      const data = queries[index]?.data;
      if (data) {
        map.set(id, data.totalElements);
      }
    });
    return map;
  }, [uniqueIds, queries]);
}
