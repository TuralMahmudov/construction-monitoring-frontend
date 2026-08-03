import { useCallback, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { TreeNodePicker, type TreeNodePickerNode } from '../../../shared/components';
import { getCategoryChildren } from '../api/resourceCategoryApi';
import { useCategoryTree } from '../hooks/useCategoryTree';
import { categoryKeys } from '../hooks/queryKeys';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { isSelfOrDescendant } from '../utils/categoryTree.utils';

export interface CategoryParentPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** When editing, excludes this category and its own descendants from being
   *  selectable as a parent, mirroring the backend's circular-reference guard. */
  excludeCategoryId?: string;
}

/**
 * Adapts the generic shared TreeNodePicker to resource-category data: fetches
 * the root tree plus children of whichever nodes are expanded (via a single
 * useQueries call keyed off the expansion state, so no hooks run in a loop),
 * and flags self/descendant nodes of `excludeCategoryId` as unselectable.
 *
 * Note: the tree starts collapsed even when editing a deeply nested category,
 * so the current parent isn't auto-scrolled into view — the caller is
 * expected to surface the current parent's name as plain text alongside this
 * picker for context.
 */
export function CategoryParentPicker({ value, onChange, excludeCategoryId }: CategoryParentPickerProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const treeQuery = useCategoryTree();
  // Root categories omit `parentId` entirely (undefined, not null) — see
  // the same fix/explanation in CategoryTree.tsx.
  const roots = useMemo(
    () => (treeQuery.data ?? []).filter((category) => category.parentId == null),
    [treeQuery.data],
  );

  const childrenQueries = useQueries({
    queries: expandedIds.map((parentId) => ({
      queryKey: categoryKeys.children(parentId),
      queryFn: () => getCategoryChildren(parentId),
    })),
  });

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, ResourceCategory[]>();
    expandedIds.forEach((parentId, index) => {
      const data = childrenQueries[index]?.data;
      if (data) {
        map.set(parentId, data);
      }
    });
    return map;
  }, [expandedIds, childrenQueries]);

  const nodesById = useMemo(() => {
    const map = new Map<string, ResourceCategory>();
    roots.forEach((category) => map.set(category.id, category));
    childrenByParentId.forEach((children) => {
      children.forEach((category) => map.set(category.id, category));
    });
    return map;
  }, [roots, childrenByParentId]);

  const buildNode = useCallback(
    (category: ResourceCategory): TreeNodePickerNode => {
      const disabled = excludeCategoryId
        ? isSelfOrDescendant(category.id, excludeCategoryId, nodesById)
        : false;
      const fetchedChildren = childrenByParentId.get(category.id);

      return {
        id: category.id,
        label: category.name,
        disabled,
        hasChildren: !category.leaf,
        children: fetchedChildren?.map(buildNode),
      };
    },
    [childrenByParentId, excludeCategoryId, nodesById],
  );

  const pickerRoots = useMemo(() => roots.map(buildNode), [roots, buildNode]);

  const loadingNodeIds = useMemo(
    () => expandedIds.filter((_id, index) => childrenQueries[index]?.isLoading),
    [expandedIds, childrenQueries],
  );

  // Fetching is driven reactively by expandedIds via useQueries above; this
  // callback exists to satisfy TreeNodePicker's generic contract for
  // consumers that need an imperative fetch trigger instead.
  const handleLoadChildren = useCallback(() => {}, []);

  if (treeQuery.isLoading) {
    return null;
  }

  return (
    <TreeNodePicker
      roots={pickerRoots}
      value={value}
      onChange={onChange}
      expandedIds={expandedIds}
      onExpandedIdsChange={setExpandedIds}
      onLoadChildren={handleLoadChildren}
      loadingNodeIds={loadingNodeIds}
    />
  );
}
