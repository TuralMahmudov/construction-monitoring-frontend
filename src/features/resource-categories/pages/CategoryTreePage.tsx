import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { PageContainer, PageHeader } from '../../../shared/components';
import { getCategoryById } from '../api/resourceCategoryApi';
import { CategoryDetailsPanel } from '../components/CategoryDetailsPanel';
import { CategoryFormDrawer } from '../components/CategoryFormDrawer';
import { CategoryTree } from '../components/CategoryTree';
import { CategoryTreeToolbar } from '../components/CategoryTreeToolbar';
import { MoveCategoryDialog } from '../components/MoveCategoryDialog';
import { categoryKeys } from '../hooks/queryKeys';
import { useCategoryUiStore } from '../store/categoryUiStore';

export function CategoryTreePage() {
  const pendingFocusId = useCategoryUiStore((state) => state.pendingFocusId);
  const selectNode = useCategoryUiStore((state) => state.selectNode);
  const expandNode = useCategoryUiStore((state) => state.expandNode);
  const clearPendingFocus = useCategoryUiStore((state) => state.clearPendingFocus);
  const queryClient = useQueryClient();

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
        title="Resurs Kateqoriyaları"
        subtitle="İyerarxik kateqoriya kataloqu"
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
      <MoveCategoryDialog />
    </PageContainer>
  );
}
