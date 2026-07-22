import { useQuery } from '@tanstack/react-query';
import { getCategoryChildren } from '../api/resourceCategoryApi';
import { categoryKeys } from './queryKeys';

export function useCategoryChildren(parentId: string, enabled: boolean) {
  return useQuery({
    queryKey: categoryKeys.children(parentId),
    queryFn: () => getCategoryChildren(parentId),
    enabled,
  });
}
