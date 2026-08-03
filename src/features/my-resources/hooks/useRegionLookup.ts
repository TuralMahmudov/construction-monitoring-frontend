import { useMemo } from 'react';
import { useAllRegions } from '../../reference-data/hooks/useReferenceOptions';

export function useRegionLookup() {
  const regionsQuery = useAllRegions();
  return useMemo(() => {
    const map = new Map<string, string>();
    (regionsQuery.data?.content ?? []).forEach((region) => map.set(region.id, region.name));
    return map;
  }, [regionsQuery.data]);
}
