import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DriveFileMoveRoundedIcon from '@mui/icons-material/DriveFileMoveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useCategory } from '../hooks/useCategory';
import { useToggleCategoryActive } from '../hooks/useToggleCategoryActive';
import { useCategoryUiStore } from '../store/categoryUiStore';

export function CategoryTreeToolbar() {
  const selectedId = useCategoryUiStore((state) => state.selectedId);
  const openCreateDrawer = useCategoryUiStore((state) => state.openCreateDrawer);
  const openEditDrawer = useCategoryUiStore((state) => state.openEditDrawer);
  const openMoveDialog = useCategoryUiStore((state) => state.openMoveDialog);
  const requestDelete = useCategoryUiStore((state) => state.requestDelete);

  const selectedQuery = useCategory(selectedId);
  const toggleActiveMutation = useToggleCategoryActive();
  const selected = selectedQuery.data ?? null;

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => openCreateDrawer(null)}>
        Kök kateqoriya
      </Button>
      <Button
        startIcon={<AddRoundedIcon />}
        disabled={!selected}
        onClick={() => selected && openCreateDrawer(selected.id)}
      >
        Alt kateqoriya
      </Button>
      <Button
        startIcon={<EditRoundedIcon />}
        disabled={!selected}
        onClick={() => selected && openEditDrawer(selected)}
      >
        Redaktə et
      </Button>
      <Button
        startIcon={<DriveFileMoveRoundedIcon />}
        disabled={!selected}
        onClick={() => selected && openMoveDialog(selected)}
      >
        Köçür
      </Button>
      <Button
        startIcon={selected?.active ? <BlockRoundedIcon /> : <CheckCircleRoundedIcon />}
        disabled={!selected}
        onClick={() =>
          selected && toggleActiveMutation.mutate({ category: selected, active: !selected.active })
        }
      >
        {selected?.active ? 'Deaktiv et' : 'Aktivləşdir'}
      </Button>
      <Button
        startIcon={<DeleteRoundedIcon />}
        color="error"
        disabled={!selected}
        onClick={() => selected && requestDelete(selected)}
      >
        Sil
      </Button>
    </Stack>
  );
}
