import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryTree } from '../hooks/useCategoryTree';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { CategoryTreeItem } from './CategoryTreeItem';

export function CategoryTree() {
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
