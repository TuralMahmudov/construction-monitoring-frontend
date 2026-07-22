import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { ConfirmDialog } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryTree } from '../hooks/useCategoryTree';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import { useToggleCategoryActive } from '../hooks/useToggleCategoryActive';
import { useCategoryUiStore } from '../store/categoryUiStore';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { CategoryContextMenu } from './CategoryContextMenu';
import { CategoryTreeItem } from './CategoryTreeItem';
import type { MenuAnchorPosition } from './menuAnchorPosition';

export function CategoryTree() {
  const treeQuery = useCategoryTree();
  const deleteMutation = useDeleteCategory();
  const toggleActiveMutation = useToggleCategoryActive();

  const selectedId = useCategoryUiStore((state) => state.selectedId);
  const expandedIds = useCategoryUiStore((state) => state.expandedIds);
  const deleteTarget = useCategoryUiStore((state) => state.deleteTarget);
  const selectNode = useCategoryUiStore((state) => state.selectNode);
  const setExpandedIds = useCategoryUiStore((state) => state.setExpandedIds);
  const openCreateDrawer = useCategoryUiStore((state) => state.openCreateDrawer);
  const openEditDrawer = useCategoryUiStore((state) => state.openEditDrawer);
  const openMoveDialog = useCategoryUiStore((state) => state.openMoveDialog);
  const requestDelete = useCategoryUiStore((state) => state.requestDelete);
  const cancelDelete = useCategoryUiStore((state) => state.cancelDelete);

  const [contextMenu, setContextMenu] = useState<{
    category: ResourceCategory;
    position: MenuAnchorPosition;
  } | null>(null);

  function handleOpenMenu(category: ResourceCategory, position: MenuAnchorPosition) {
    setContextMenu({ category, position });
  }

  function handleToggleActive(category: ResourceCategory) {
    toggleActiveMutation.mutate({ category, active: !category.active });
  }

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
        <Button variant="outlined" onClick={() => openCreateDrawer(null)}>
          Kök kateqoriya əlavə et
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <SimpleTreeView
        expandedItems={expandedIds}
        onExpandedItemsChange={(_event, ids) => setExpandedIds(ids)}
        selectedItems={selectedId}
        onSelectedItemsChange={(_event, id) => selectNode(id)}
      >
        {roots.map((root) => (
          <CategoryTreeItem
            key={root.id}
            category={root}
            expandedIds={expandedIds}
            onOpenMenu={handleOpenMenu}
          />
        ))}
      </SimpleTreeView>

      <CategoryContextMenu
        category={contextMenu?.category ?? null}
        position={contextMenu?.position ?? null}
        onClose={() => setContextMenu(null)}
        onAddChild={(category) => openCreateDrawer(category.id)}
        onEdit={(category) => openEditDrawer(category)}
        onMove={(category) => openMoveDialog(category)}
        onToggleActive={handleToggleActive}
        onDelete={(category) => requestDelete(category)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Kateqoriyanı sil"
        description={`"${deleteTarget?.name ?? ''}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
        confirmLabel="Sil"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(
            { id: deleteTarget.id, parentId: deleteTarget.parentId },
            {
              onSuccess: () => {
                if (selectedId === deleteTarget.id) {
                  selectNode(null);
                }
                cancelDelete();
              },
              onError: () => cancelDelete(),
            },
          );
        }}
        onCancel={cancelDelete}
      />
    </>
  );
}
