import { getCategoryTree } from '../../resource-categories/api/resourceCategoryApi';
import type { ResourceCategoryTreeNode } from '../../resource-categories/types/resourceCategory.types';

/**
 * GET /resource-categories/tree returns the full hierarchy in one call, with
 * every descendant nested under each node's `children` array — this just
 * flattens that into a single list for the picker.
 */
export async function fetchFullCategoryList(): Promise<ResourceCategoryTreeNode[]> {
  const roots = await getCategoryTree();
  const all: ResourceCategoryTreeNode[] = [];

  function collect(node: ResourceCategoryTreeNode | null | undefined) {
    if (!node) {
      return;
    }
    all.push(node);
    node.children?.forEach(collect);
  }

  roots.forEach(collect);
  return all;
}
