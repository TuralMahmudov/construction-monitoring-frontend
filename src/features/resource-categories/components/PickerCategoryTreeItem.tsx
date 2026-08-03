import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Product } from '../../products/types/product.types';
import type { ResourceCategoryTreeNode } from '../types/resourceCategory.types';
import { CategoryProductChildren } from './CategoryProductChildren';

export interface PickerCategoryTreeItemProps {
  category: ResourceCategoryTreeNode;
  expandedIds: string[];
  onSelectCategory: (category: ResourceCategoryTreeNode) => void;
  onSelectProduct: (product: Product, categoryId: string) => void;
}

// § "yalnız leaf kateqoriyalar seçilə bilsin, kök/ara kateqoriyalar sadəcə
// naviqasiya üçündür" — non-leaf labels have no click handler at all (only
// the row's expand arrow, wired separately via SimpleTreeView's own
// expandedItems, does anything); leaf labels are clickable and hand back the
// category itself, exactly mirroring how a product row hands back a product.
export function PickerCategoryTreeItem({
  category,
  expandedIds,
  onSelectCategory,
  onSelectProduct,
}: PickerCategoryTreeItemProps) {
  const isExpanded = expandedIds.includes(category.id);

  return (
    <TreeItem
      itemId={category.id}
      label={
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            py: 0.5,
            cursor: category.leaf ? 'pointer' : 'default',
            '&:hover': category.leaf ? { color: 'primary.main' } : undefined,
          }}
          onClick={
            category.leaf
              ? (event) => {
                  event.stopPropagation();
                  onSelectCategory(category);
                }
              : undefined
          }
        >
          <Typography variant="body2" sx={{ fontWeight: category.leaf ? 600 : 500 }}>
            {category.name}
          </Typography>
        </Stack>
      }
    >
      {category.leaf
        ? (
            <CategoryProductChildren
              categoryId={category.id}
              enabled={isExpanded}
              onSelectProduct={(product) => onSelectProduct(product, category.id)}
            />
          )
        : (category.children ?? []).map((child) => (
            <PickerCategoryTreeItem
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              onSelectCategory={onSelectCategory}
              onSelectProduct={onSelectProduct}
            />
          ))}
    </TreeItem>
  );
}
