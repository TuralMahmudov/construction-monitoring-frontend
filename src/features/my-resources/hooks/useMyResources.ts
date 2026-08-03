import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchMyResources } from '../api/myResourcesApi';
import type { MyResourceSearchParams } from '../types/myResource.types';
import { myResourceKeys } from './queryKeys';

export function useMyResources(params: MyResourceSearchParams) {
  return useQuery({
    queryKey: myResourceKeys.search(params),
    queryFn: () => searchMyResources(params),
    placeholderData: keepPreviousData,
  });
}
