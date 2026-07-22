import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchResources } from '../api/resourcesApi';
import type { ResourceSearchParams } from '../types/resource.types';
import { resourceKeys } from './queryKeys';

export function useResourceSearch(params: ResourceSearchParams) {
  return useQuery({
    queryKey: resourceKeys.search(params),
    queryFn: () => searchResources(params),
    placeholderData: keepPreviousData,
  });
}
