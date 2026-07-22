import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useMoveCategory } from '../hooks/useMoveCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { CategoryParentPicker } from './CategoryParentPicker';

export function MoveCategoryDialog() {
  const moveDialog = useCategoryUiStore((state) => state.moveDialog);
  const closeMoveDialog = useCategoryUiStore((state) => state.closeMoveDialog);
  const moveMutation = useMoveCategory();
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const category = moveDialog.category;

  useEffect(() => {
    if (moveDialog.open) {
      setNewParentId(moveDialog.category?.parentId ?? null);
      setError(null);
    }
  }, [moveDialog.open, moveDialog.category]);

  function handleConfirm() {
    if (!category) {
      return;
    }
    setError(null);
    moveMutation.mutate(
      { category, newParentId },
      {
        onSuccess: () => closeMoveDialog(),
        onError: (mutationError) => setError(getApiErrorMessage(mutationError)),
      },
    );
  }

  const unchanged = category ? newParentId === category.parentId : true;

  return (
    <Dialog open={moveDialog.open} onClose={closeMoveDialog} maxWidth="xs" fullWidth>
      <DialogTitle>Kateqoriyanı köçür</DialogTitle>
      <DialogContent>
        {category && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            &quot;{category.name}&quot; kateqoriyası üçün yeni valideyn seçin.
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {category && (
          <CategoryParentPicker
            value={newParentId}
            onChange={setNewParentId}
            excludeCategoryId={category.id}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeMoveDialog} disabled={moveMutation.isPending}>
          İmtina
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={moveMutation.isPending || !category || unchanged}
        >
          {moveMutation.isPending ? 'Köçürülür...' : 'Köçür'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
