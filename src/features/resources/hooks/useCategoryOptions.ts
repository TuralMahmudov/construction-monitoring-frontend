import { useMemo } from 'react';
import { flattenCategoryPaths } from '../utils/flattenCategoryPaths';
import { useFullCategoryList } from './useFullCategoryList';

/** Flattened "Parent > Child" category options for the resource form's picker. */
export function useCategoryOptions() {
  const listQuery = useFullCategoryList();

  const options = useMemo(() => flattenCategoryPaths(listQuery.data ?? []), [listQuery.data]);

  return { options, isLoading: listQuery.isLoading, isError: listQuery.isError };
}
