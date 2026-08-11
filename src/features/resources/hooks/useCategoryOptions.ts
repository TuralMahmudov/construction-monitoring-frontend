import { useMemo } from 'react';
import { flattenCategoryPaths } from '../utils/flattenCategoryPaths';
import { useFullCategoryList } from './useFullCategoryList';

/** Flattened "Parent > Child" category options for the resource form's picker.
 *  `leafOnly` — a product/resource can only ever belong to a leaf category, so
 *  pickers used to assign one (as opposed to browsing/searching the whole
 *  tree, bax CategoryTree's search box) should pass `true`: an intermediate
 *  category is never a valid target and, for search filters, silently
 *  matches nothing (products are indexed by their own leaf categoryId, not
 *  any ancestor). */
export function useCategoryOptions(leafOnly = false) {
  const listQuery = useFullCategoryList();

  const options = useMemo(() => flattenCategoryPaths(listQuery.data ?? [], leafOnly), [listQuery.data, leafOnly]);

  return { options, isLoading: listQuery.isLoading, isError: listQuery.isError };
}
