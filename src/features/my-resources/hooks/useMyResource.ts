import { useQuery } from '@tanstack/react-query';
import { getMyResourceById } from '../api/myResourcesApi';
import { myResourceKeys } from './queryKeys';

export function useMyResource(id: string | null) {
  return useQuery({
    queryKey: myResourceKeys.detail(id ?? ''),
    queryFn: () => getMyResourceById(id as string),
    enabled: id !== null,
  });
}
