import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCategories } from '../api/resourceCategoryApi';
import type { CategorySearchParams } from '../types/resourceCategory.types';
import { categoryKeys } from './queryKeys';

export function useCategorySearch(params: CategorySearchParams) {
  return useQuery({
    queryKey: categoryKeys.search(params),
    queryFn: () => searchCategories(params),
    placeholderData: keepPreviousData,
  });
}
