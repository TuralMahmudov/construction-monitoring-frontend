import { useQuery } from '@tanstack/react-query';
import { getCategoryTree } from '../api/resourceCategoryApi';
import { categoryKeys } from './queryKeys';

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: getCategoryTree,
  });
}
