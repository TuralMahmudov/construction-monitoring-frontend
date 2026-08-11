import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Product } from '../../products/types/product.types';
import { makeProductTreeItemId } from '../utils/treeItemId';

export interface ProductTreeItemProps {
  product: Product;
  summary: string;
  /** Present only in picker contexts (bax CategoryProductTreePicker) — turns
   *  the row into a clickable "choose this product" action. Browse-only
   *  usage (CategoryTree) omits this and relies on SimpleTreeView's own
   *  selection instead. */
  onSelect?: (product: Product) => void;
}

// A product as the tree's final ring under its leaf category — just its
// comma-joined attribute values (e.g. "Keramik, 250x120x65"), not its name;
// the values alone are what distinguishes one catalog row from another here.
// Falls back to the name only for the rare product with no attributes at
// all, so the row is never blank.
export function ProductTreeItem({ product, summary, onSelect }: ProductTreeItemProps) {
  return (
    <TreeItem
      itemId={makeProductTreeItemId(product.id)}
      label={
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'center',
            py: 0.5,
            minWidth: 0,
            cursor: onSelect ? 'pointer' : 'default',
            '&:hover': onSelect ? { color: 'primary.main' } : undefined,
          }}
          onClick={
            onSelect
              ? (event) => {
                  event.stopPropagation();
                  onSelect(product);
                }
              : undefined
          }
        >
          <Inventory2RoundedIcon fontSize="small" color="disabled" sx={{ flexShrink: 0 }} />
          <Tooltip title={summary || product.name}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
              {summary || product.name}
            </Typography>
          </Tooltip>
        </Stack>
      }
    />
  );
}
