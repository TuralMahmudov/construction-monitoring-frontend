import { useQuery } from '@tanstack/react-query';
import { getResourceById } from '../api/resourcesApi';
import { resourceKeys } from './queryKeys';

export function useResource(id: string | null) {
  return useQuery({
    queryKey: resourceKeys.detail(id ?? ''),
    queryFn: () => getResourceById(id as string),
    enabled: id !== null,
  });
}
