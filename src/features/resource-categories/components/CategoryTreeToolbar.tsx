import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useAuth } from '../../../hooks/useAuth';
import { isCentralAdmin } from '../../../shared/lib/permissions';
import { useCategory } from '../hooks/useCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { parseTreeItemId } from '../utils/treeItemId';

// Kateqoriya CRUD (yaratma/redaktə/silmə) — 2026-07-30-da təhlükəsizlik
// səbəbilə tam gizlədilmişdi (istənilən istifadəçi strukturu poza bilərdi),
// indi YALNIZ mərkəzi təşkilat üçün bərpa olunub. Köçür/Deaktiv et hələ də
// gizlidir — lazım olsa sonra əlavə olunacaq.
export function CategoryTreeToolbar() {
  const { user } = useAuth();
  const canManage = isCentralAdmin(user?.roles ?? []);

  const selectedId = useCategoryUiStore((state) => state.selectedId);
  const openCreateDrawer = useCategoryUiStore((state) => state.openCreateDrawer);
  const openEditDrawer = useCategoryUiStore((state) => state.openEditDrawer);
  const requestDelete = useCategoryUiStore((state) => state.requestDelete);

  // A selected product node has no category counterpart to edit/delete —
  // only a category-type selection enables these actions.
  const selection = selectedId ? parseTreeItemId(selectedId) : null;
  const selectedCategoryId = selection?.type === 'category' ? selection.id : null;
  const selectedQuery = useCategory(selectedCategoryId);
  const selected = selectedQuery.data ?? null;

  if (!canManage) {
    return null;
  }

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
