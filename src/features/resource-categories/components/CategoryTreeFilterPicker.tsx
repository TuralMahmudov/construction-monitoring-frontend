import { useMemo, useState } from 'react';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryOptions } from '../../resources/hooks/useCategoryOptions';
import { useFullCategoryList } from '../../resources/hooks/useFullCategoryList';
import { useCategoryTree } from '../hooks/useCategoryTree';
import type { ResourceCategoryTreeNode } from '../types/resourceCategory.types';
import { CategoryFilterTreeItem } from './CategoryFilterTreeItem';

export interface CategoryTreeFilterPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  disabled?: boolean;
}

function nodeMatches(node: ResourceCategoryTreeNode, query: string): boolean {
  if (node.name.toLocaleLowerCase('az').includes(query)) {
    return true;
  }
  return (node.children ?? []).some((child) => nodeMatches(child, query));
}

function filterTree(nodes: ResourceCategoryTreeNode[], query: string): ResourceCategoryTreeNode[] {
  if (!query) {
    return nodes;
  }
  return nodes
    .filter((node) => nodeMatches(node, query))
    .map((node) => ({ ...node, children: node.children ? filterTree(node.children, query) : node.children }));
}

function collectNonLeafIds(nodes: ResourceCategoryTreeNode[]): string[] {
  return nodes.flatMap((node) => (node.leaf ? [] : [node.id, ...collectNonLeafIds(node.children ?? [])]));
}

// Tree-based replacement for the flat "Parent > Child > ..." path dropdown
// (bax CategoryPathAutocomplete) — a non-leaf category there silently matched
// zero products (a product's categoryId is always a leaf), so picking one
// looked like a bug. Mirrors CategoryProductTreePicker's leaf-only-selectable
// convention (bold+clickable leaf, plain navigation-only ancestor) without
// its nested product list — this is a plain category filter, not a "pick a
// specific product" flow. Multi-select and virtualization intentionally left
// out — the real category count here is ~15-20, not hundreds (bax söhbət
// 2026-08-11).
export function CategoryTreeFilterPicker({
  value,
  onChange,
  label = 'Kateqoriya',
  disabled,
}: CategoryTreeFilterPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [manualExpandedIds, setManualExpandedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  const treeQuery = useCategoryTree();
  const fullListQuery = useFullCategoryList();
  const { options: leafOptions } = useCategoryOptions(true);

  const roots = (treeQuery.data ?? []).filter((category) => category.parentId == null);
  const query = searchText.trim().toLocaleLowerCase('az');
  // While searching, which branches are open is derived from the matches
  // themselves (every ancestor of a hit) rather than tracked manually — bax
  // CategoryTree.tsx-in axtarış qutusu, eyni "match tapılanda parent-ləri aç"
  // məntiqi, sadəcə budaqları gizlətməklə (filterTree) bir addım irəli.
  const filteredRoots = useMemo(() => filterTree(roots, query), [roots, query]);
  const searchExpandedIds = useMemo(() => collectNonLeafIds(filteredRoots), [filteredRoots]);
  const expandedIds = query ? searchExpandedIds : manualExpandedIds;

  const selectedLabel = value ? (leafOptions.find((option) => option.id === value)?.name ?? '') : '';

  function closePopover() {
    setAnchorEl(null);
    setSearchText('');
  }

  // Açılanda hazırkı seçimə qədər ağacı avtomatik açır ki, göy rənglə
  // işarələnmiş node dərhal görünsün (bax "Seçilənlər göy rəngdə qalsın").
  function openPopover(anchor: HTMLElement) {
    setAnchorEl(anchor);
    if (value) {
      const byId = new Map((fullListQuery.data ?? []).map((category) => [category.id, category]));
      const ancestorIds: string[] = [];
      let current = byId.get(value);
      const visited = new Set<string>();
      while (current?.parentId && !visited.has(current.parentId)) {
        ancestorIds.push(current.parentId);
        visited.add(current.parentId);
        current = byId.get(current.parentId);
      }
      setManualExpandedIds(ancestorIds);
    }
  }

  function handleSelect(category: ResourceCategoryTreeNode) {
    onChange(category.id);
    closePopover();
  }

  return (
    <Box>
      <TextField
        label={label}
        fullWidth
        size="small"
        value={selectedLabel}
        placeholder="Hamısı"
        onClick={(event) => !disabled && openPopover(event.currentTarget)}
        disabled={disabled}
        slotProps={{
          input: {
            readOnly: true,
            sx: { cursor: disabled ? 'default' : 'pointer' },
            endAdornment: (
              <InputAdornment position="end">
                {value && (
                  <IconButton
                    size="small"
                    aria-label="Kateqoriyanı təmizlə"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange(null);
                    }}
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                )}
                <ExpandMoreRoundedIcon fontSize="small" sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { width: anchorEl?.clientWidth, minWidth: 320 } },
        }}
      >
        <Box sx={{ maxHeight: 420, p: 1.5 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Axtar..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1 }}
          />

          <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
            {treeQuery.isLoading && (
              <Stack sx={{ alignItems: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Stack>
            )}

            {treeQuery.isError && <Alert severity="error">{getApiErrorMessage(treeQuery.error)}</Alert>}

            {!treeQuery.isLoading && !treeQuery.isError && filteredRoots.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Kateqoriya tapılmadı
              </Typography>
            )}

            {!treeQuery.isLoading && !treeQuery.isError && filteredRoots.length > 0 && (
              <SimpleTreeView
                expandedItems={expandedIds}
                onExpandedItemsChange={(_event, ids) => {
                  if (!query) {
                    setManualExpandedIds(ids);
                  }
                }}
              >
                {filteredRoots.map((root) => (
                  <CategoryFilterTreeItem key={root.id} category={root} selectedId={value} onSelect={handleSelect} />
                ))}
              </SimpleTreeView>
            )}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
