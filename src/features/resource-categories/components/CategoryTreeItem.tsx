import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useCategoryChildren } from '../hooks/useCategoryChildren';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { CategoryTreeItemLabel } from './CategoryTreeItemLabel';
import type { MenuAnchorPosition } from './menuAnchorPosition';

export interface CategoryTreeItemProps {
  category: ResourceCategory;
  expandedIds: string[];
  onOpenMenu: (category: ResourceCategory, position: MenuAnchorPosition) => void;
}

export function CategoryTreeItem({ category, expandedIds, onOpenMenu }: CategoryTreeItemProps) {
  const isExpanded = expandedIds.includes(category.id);
  const childrenQuery = useCategoryChildren(category.id, isExpanded && !category.leaf);

  return (
    <TreeItem
      itemId={category.id}
      label={<CategoryTreeItemLabel category={category} onOpenMenu={onOpenMenu} />}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(category, { top: event.clientY, left: event.clientX });
      }}
    >
      {!category.leaf &&
        (childrenQuery.isLoading ? (
          <TreeItem
            itemId={`${category.id}__loading`}
            label={<CircularProgress size={16} sx={{ my: 1 }} />}
            disabled
          />
        ) : childrenQuery.data && childrenQuery.data.length > 0 ? (
          childrenQuery.data.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              onOpenMenu={onOpenMenu}
            />
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
        ))}
    </TreeItem>
  );
}
