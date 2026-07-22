import { useQuery } from '@tanstack/react-query';
import { getCategoryById } from '../api/resourceCategoryApi';
import { categoryKeys } from './queryKeys';

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: () => getCategoryById(id as string),
    enabled: id !== null,
  });
}
