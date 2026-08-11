import { useMemo } from 'react';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { useFullCategoryList } from './useFullCategoryList';

export function useCategoryNameLookup() {
  const listQuery = useFullCategoryList();
  return useMemo(() => {
    const map = new Map<string, string>();
    (listQuery.data ?? []).forEach((category) => map.set(category.id, category.name));
    return map;
  }, [listQuery.data]);
}

export function useUnitLookup(enabled = true) {
  const unitsQuery = useUnitOptions(enabled);
  return useMemo(() => {
    const map = new Map<string, string>();
    (unitsQuery.data?.content ?? []).forEach((unit) => map.set(unit.id, unit.symbol || unit.name));
    return map;
  }, [unitsQuery.data]);
}
