import { useQuery } from '@tanstack/react-query';
import { fetchFullCategoryList } from '../utils/fetchFullCategoryList';

export function useFullCategoryList() {
  return useQuery({
    queryKey: ['resource-categories', 'full-flat-list'],
    queryFn: fetchFullCategoryList,
    staleTime: 60_000,
  });
}
