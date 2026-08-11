import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryOptions } from '../../resources/hooks/useCategoryOptions';
import { useFullCategoryList } from '../../resources/hooks/useFullCategoryList';
import type { FlatCategoryOption } from '../../resources/utils/flattenCategoryPaths';
import { useCategoryTree } from '../hooks/useCategoryTree';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { CategoryTreeItem } from './CategoryTreeItem';

// 6 levels deep, manual-expand-only made finding a specific category tedious
// — this searches by name across the full (already-cached) flat category
// list and, on picking a match, expands every ancestor down to it so it's
// immediately visible instead of just reporting "found it, go look".
function CategoryTreeSearch() {
  const { options } = useCategoryOptions();
  const listQuery = useFullCategoryList();
  const expandedIds = useCategoryUiStore((state) => state.expandedIds);
  const setExpandedIds = useCategoryUiStore((state) => state.setExpandedIds);
  const selectNode = useCategoryUiStore((state) => state.selectNode);

  function handleSelect(option: FlatCategoryOption | null) {
    if (!option) {
      return;
    }
    const categories = listQuery.data ?? [];
    const byId = new Map(categories.map((category) => [category.id, category]));

    const ancestorIds: string[] = [];
    let current = byId.get(option.id);
    const visited = new Set<string>();
    while (current?.parentId && !visited.has(current.parentId)) {
      ancestorIds.push(current.parentId);
      visited.add(current.parentId);
      current = byId.get(current.parentId);
    }

    setExpandedIds([...new Set([...expandedIds, ...ancestorIds])]);
    selectNode(option.id);
  }

  return (
    <Autocomplete<FlatCategoryOption>
      options={options}
      getOptionLabel={(option) => option.path}
      onChange={(_event, option) => handleSelect(option)}
      value={null}
      blurOnSelect
      clearOnBlur
      noOptionsText="Kateqoriya tapılmadı"
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Kateqoriya axtar..."
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}

function CategoryTreeContent() {
  const treeQuery = useCategoryTree();

  const selectedId = useCategoryUiStore((state) => state.selectedId);
  const expandedIds = useCategoryUiStore((state) => state.expandedIds);
  const selectNode = useCategoryUiStore((state) => state.selectNode);
  const setExpandedIds = useCategoryUiStore((state) => state.setExpandedIds);

  if (treeQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (treeQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(treeQuery.error)}</Alert>;
  }

  // Root categories omit the `parentId` field entirely in the API response
  // (it's `undefined`, not `null`) — `== null` catches both; `=== null`
  // silently filtered out every root and left the tree empty.
  const roots = (treeQuery.data ?? []).filter((category) => category.parentId == null);

  if (roots.length === 0) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', py: 6 }}>
        <Typography color="text.secondary">Hələ heç bir kateqoriya yaradılmayıb.</Typography>
      </Stack>
    );
  }

  return (
    <SimpleTreeView
      expandedItems={expandedIds}
      onExpandedItemsChange={(_event, ids) => setExpandedIds(ids)}
      selectedItems={selectedId}
      onSelectedItemsChange={(_event, id) => selectNode(id)}
    >
      {roots.map((root) => (
        <CategoryTreeItem key={root.id} category={root} expandedIds={expandedIds} />
      ))}
    </SimpleTreeView>
  );
}

export function CategoryTree() {
  return (
    <Stack spacing={2}>
      <CategoryTreeSearch />
      <CategoryTreeContent />
    </Stack>
  );
}
