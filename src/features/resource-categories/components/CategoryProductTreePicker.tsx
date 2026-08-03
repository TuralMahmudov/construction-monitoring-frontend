import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { Product } from '../../products/types/product.types';
import { useCategoryTree } from '../hooks/useCategoryTree';
import type { ResourceCategoryTreeNode } from '../types/resourceCategory.types';
import { PickerCategoryTreeItem } from './PickerCategoryTreeItem';

export type CategoryProductPickerValue =
  | { type: 'category'; categoryId: string; label: string }
  | { type: 'product'; categoryId: string; product: Product; label: string };

export interface CategoryProductTreePickerProps {
  value: CategoryProductPickerValue | null;
  onChange: (value: CategoryProductPickerValue) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

// Replaces the old flat "Parent > Child" CategoryPathAutocomplete (§ Mənim
// Resurslarım) with a combined kateqoriya+məhsul ağacı: only leaf categories
// and product rows can be picked (bax PickerCategoryTreeItem), an ancestor
// category like "Tikinti məmulatları" is navigation-only.
export function CategoryProductTreePicker({
  value,
  onChange,
  label = 'Kateqoriya / Məhsul',
  error,
  helperText,
  disabled,
}: CategoryProductTreePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const treeQuery = useCategoryTree();

  const roots = (treeQuery.data ?? []).filter((category) => category.parentId == null);

  function handleSelectCategory(category: ResourceCategoryTreeNode) {
    onChange({ type: 'category', categoryId: category.id, label: category.name });
    setAnchorEl(null);
  }

  function handleSelectProduct(product: Product, categoryId: string) {
    onChange({ type: 'product', categoryId, product, label: `${product.code} — ${product.name}` });
    setAnchorEl(null);
  }

  return (
    <Box>
      <TextField
        label={label}
        fullWidth
        value={value?.label ?? ''}
        placeholder="Seçmək üçün klikləyin"
        onClick={(event) => !disabled && setAnchorEl(event.currentTarget)}
        error={error}
        helperText={helperText}
        disabled={disabled}
        slotProps={{
          input: {
            readOnly: true,
            sx: { cursor: disabled ? 'default' : 'pointer' },
            endAdornment: (
              <InputAdornment position="end">
                <ExpandMoreRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ width: 400, maxHeight: 420, overflowY: 'auto', p: 1.5 }}>
          {treeQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Stack>
          )}

          {treeQuery.isError && <Alert severity="error">{getApiErrorMessage(treeQuery.error)}</Alert>}

          {!treeQuery.isLoading && !treeQuery.isError && (
            <SimpleTreeView
              expandedItems={expandedIds}
              onExpandedItemsChange={(_event, ids) => setExpandedIds(ids)}
            >
              {roots.map((root) => (
                <PickerCategoryTreeItem
                  key={root.id}
                  category={root}
                  expandedIds={expandedIds}
                  onSelectCategory={handleSelectCategory}
                  onSelectProduct={handleSelectProduct}
                />
              ))}
            </SimpleTreeView>
          )}
        </Box>
      </Popover>
    </Box>
  );
}
