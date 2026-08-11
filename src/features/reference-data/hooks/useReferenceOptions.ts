import { useQuery } from '@tanstack/react-query';
import { regionsApi } from '../api/regionsApi';
import { unitsApi } from '../api/unitsApi';

const OPTIONS_PAGE_SIZE = 200;
const OPTIONS_STALE_TIME = 5 * 60_000;

export function useUnitOptions(enabled = true) {
  return useQuery({
    queryKey: ['units', 'options'],
    queryFn: () => unitsApi.list({ active: true, size: OPTIONS_PAGE_SIZE }),
    staleTime: OPTIONS_STALE_TIME,
    enabled,
  });
}

export function useRegionOptions(enabled = true) {
  return useQuery({
    queryKey: ['regions', 'options'],
    queryFn: () => regionsApi.list({ active: true, size: OPTIONS_PAGE_SIZE }),
    staleTime: OPTIONS_STALE_TIME,
    enabled,
  });
}

// Unfiltered variant for display/lookup purposes (e.g. showing the name of
// a region referenced by a historical price row, which may since have been
// deactivated) — form pickers should use the active-only version above
// instead, since only active reference data should be assignable to new
// records.
export function useAllRegions(enabled = true) {
  return useQuery({
    queryKey: ['regions', 'all'],
    queryFn: () => regionsApi.list({ size: OPTIONS_PAGE_SIZE }),
    staleTime: OPTIONS_STALE_TIME,
    enabled,
  });
}

// Same rationale as useAllRegions — a product's unitId may point at a unit
// that's since been deactivated, and the search grid should still resolve
// its symbol instead of showing blank.
export function useAllUnits(enabled = true) {
  return useQuery({
    queryKey: ['units', 'all'],
    queryFn: () => unitsApi.list({ size: OPTIONS_PAGE_SIZE }),
    staleTime: OPTIONS_STALE_TIME,
    enabled,
  });
}
