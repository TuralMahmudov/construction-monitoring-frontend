import { useMemo } from 'react';
import { useAllRegions, useAllSuppliers } from '../../../reference-data/hooks/useReferenceOptions';

export function useRegionSupplierLookup() {
  const regionsQuery = useAllRegions();
  const suppliersQuery = useAllSuppliers();

  const regionNames = useMemo(() => {
    const map = new Map<string, string>();
    (regionsQuery.data?.content ?? []).forEach((region) => map.set(region.id, region.name));
    return map;
  }, [regionsQuery.data]);

  const supplierNames = useMemo(() => {
    const map = new Map<string, string>();
    (suppliersQuery.data?.content ?? []).forEach((supplier) => map.set(supplier.id, supplier.name));
    return map;
  }, [suppliersQuery.data]);

  return {
    regionNames,
    supplierNames,
    isLoading: regionsQuery.isLoading || suppliersQuery.isLoading,
  };
}
