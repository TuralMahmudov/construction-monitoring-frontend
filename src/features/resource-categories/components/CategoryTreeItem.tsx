import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useCategoryChildren } from '../hooks/useCategoryChildren';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { CategoryProductChildren } from './CategoryProductChildren';
import { CategoryTreeItemLabel } from './CategoryTreeItemLabel';

export interface CategoryTreeItemProps {
  category: ResourceCategory;
  expandedIds: string[];
}

export function CategoryTreeItem({ category, expandedIds }: CategoryTreeItemProps) {
  const isExpanded = expandedIds.includes(category.id);
  const childrenQuery = useCategoryChildren(category.id, isExpanded && !category.leaf);

  return (
    <TreeItem itemId={category.id} label={<CategoryTreeItemLabel category={category} />}>
      {category.leaf ? (
        <CategoryProductChildren categoryId={category.id} enabled={isExpanded} />
      ) : childrenQuery.isLoading ? (
        <TreeItem
          itemId={`${category.id}__loading`}
          label={<CircularProgress size={16} sx={{ my: 1 }} />}
          disabled
        />
      ) : childrenQuery.data && childrenQuery.data.length > 0 ? (
        childrenQuery.data.map((child) => (
          <CategoryTreeItem key={child.id} category={child} expandedIds={expandedIds} />
        ))
      ) : childrenQuery.data ? (
        <TreeItem
          itemId={`${category.id}__empty`}
          label={
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Alt kateqoriya yoxdur
            </Typography>
          }
          disabled
        />
      ) : (
        // Not fetched yet (not expanded); forces the expand affordance to
        // render before lazy data arrives.
        <TreeItem itemId={`${category.id}__placeholder`} label="" disabled />
      )}
    </TreeItem>
  );
}
