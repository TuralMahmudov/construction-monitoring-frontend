import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { ConfirmDialog, PageContainer, PageHeader } from '../../../shared/components';
import { getCategoryById } from '../api/resourceCategoryApi';
import { CategoryDetailsPanel } from '../components/CategoryDetailsPanel';
import { CategoryFormDrawer } from '../components/CategoryFormDrawer';
import { CategoryTree } from '../components/CategoryTree';
import { CategoryTreeToolbar } from '../components/CategoryTreeToolbar';
import { categoryKeys } from '../hooks/queryKeys';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';

export function CategoryTreePage() {
  const pendingFocusId = useCategoryUiStore((state) => state.pendingFocusId);
  const selectNode = useCategoryUiStore((state) => state.selectNode);
  const expandNode = useCategoryUiStore((state) => state.expandNode);
  const clearPendingFocus = useCategoryUiStore((state) => state.clearPendingFocus);
  const deleteTarget = useCategoryUiStore((state) => state.deleteTarget);
  const cancelDelete = useCategoryUiStore((state) => state.cancelDelete);
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCategory();

  // "View in tree" from the search grid only knows the target's own id, so
  // its ancestor chain has to be walked one GET /{id} at a time to expand
  // every level up to the root before the node can be visible/selected.
  useEffect(() => {
    if (!pendingFocusId) {
      return;
    }
    let cancelled = false;

    async function expandPathToTarget() {
      const idsToExpand: string[] = [];
      let currentId: string | null = pendingFocusId;

      while (currentId) {
        const category = await queryClient.fetchQuery({
          queryKey: categoryKeys.detail(currentId),
          queryFn: () => getCategoryById(currentId as string),
        });
        currentId = category.parentId;
        if (currentId) {
          idsToExpand.push(currentId);
        }
      }

      if (!cancelled) {
        idsToExpand.forEach((id) => expandNode(id));
        selectNode(pendingFocusId);
        clearPendingFocus();
      }
    }

    void expandPathToTarget();
    return () => {
      cancelled = true;
    };
  }, [pendingFocusId, queryClient, expandNode, selectNode, clearPendingFocus]);

  return (
    <PageContainer>
      <PageHeader
        title="Resurs Kataloqu"
        subtitle="Kateqoriyalar və onlara bağlı məhsul kataloqu"
        actions={
          <Button
            component={RouterLink}
            to="/resource-categories/search"
            startIcon={<ManageSearchRoundedIcon />}
          >
            Axtarış görünüşü
          </Button>
        }
      />

      <CategoryTreeToolbar />

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexGrow: 1,
          minHeight: 0,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Paper variant="outlined" sx={{ flex: '1 1 60%', minWidth: 0, p: 2, overflowY: 'auto' }}>
          <CategoryTree />
        </Paper>
        <Paper variant="outlined" sx={{ flex: '1 1 40%', minWidth: 0, overflowY: 'auto' }}>
          <CategoryDetailsPanel />
        </Paper>
      </Box>

      <CategoryFormDrawer />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Kateqoriyanı sil"
        description={`"${deleteTarget?.name ?? ''}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
        confirmLabel="Sil"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          deleteMutation.mutate(
            { id: deleteTarget.id, parentId: deleteTarget.parentId },
            { onSuccess: cancelDelete, onError: cancelDelete },
          );
        }}
        onCancel={cancelDelete}
      />
    </PageContainer>
  );
}
