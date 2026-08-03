import CircularProgress from '@mui/material/CircularProgress';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Typography from '@mui/material/Typography';
import { useProductsWithAttributeSummary } from '../../products/hooks/useProductsWithAttributeSummary';
import type { Product } from '../../products/types/product.types';
import { ProductTreeItem } from './ProductTreeItem';

export interface CategoryProductChildrenProps {
  categoryId: string;
  enabled: boolean;
  /** Picker contexts only — bax ProductTreeItem. */
  onSelectProduct?: (product: Product) => void;
}

// § "tree-də son halqa kimi products" — only mounted for a leaf category
// that's actually expanded (bax CategoryTreeItem). In the browse tree the
// caller gates `enabled` on central-admin; in picker contexts it's always
// enabled (every org needs to find/pick products when creating a resource).
export function CategoryProductChildren({ categoryId, enabled, onSelectProduct }: CategoryProductChildrenProps) {
  const { items, isLoading } = useProductsWithAttributeSummary(categoryId, enabled);

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <TreeItem
        itemId={`${categoryId}__products-loading`}
        label={<CircularProgress size={16} sx={{ my: 1 }} />}
        disabled
      />
    );
  }

  if (items.length === 0) {
    return (
      <TreeItem
        itemId={`${categoryId}__products-empty`}
        label={
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Bu kateqoriyada məhsul yoxdur
          </Typography>
        }
        disabled
      />
    );
  }

  return (
    <>
      {items.map(({ product, summary }) => (
        <ProductTreeItem
          key={product.id}
          product={product}
          summary={summary}
          onSelect={onSelectProduct}
        />
      ))}
    </>
  );
}
