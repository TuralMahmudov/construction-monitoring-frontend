import type { ReactNode } from 'react';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { ProductAttributesReadOnly } from '../../products/components/ProductAttributesReadOnly';
import { useProduct } from '../../products/hooks/useProduct';
import { StatusBadge } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { CategoryAttributesPanel } from './CategoryAttributesPanel';
import { useCategory } from '../hooks/useCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { parseTreeItemId } from '../utils/treeItemId';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function CategoryDetailsPanel() {
  const selectedId = useCategoryUiStore((state) => state.selectedId);

  if (!selectedId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Ətraflı məlumat üçün ağacdan bir kateqoriya və ya məhsul seçin.
        </Typography>
      </Box>
    );
  }

  const selection = parseTreeItemId(selectedId);
  return selection.type === 'product' ? (
    <ProductNodeDetails productId={selection.id} />
  ) : (
    <CategoryNodeDetails categoryId={selection.id} />
  );
}

function CategoryNodeDetails({ categoryId }: { categoryId: string }) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const query = useCategory(categoryId);

  if (query.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Kateqoriya məlumatları yüklənə bilmədi.</Typography>
      </Box>
    );
  }

  const category = query.data;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {category.name}
      </Typography>
      <StatusBadge active={category.active} />

      {/* Attribute-linking only makes sense one level above products — a
          non-leaf row (e.g. "Tikinti materialları") has no attribute schema
          of its own, its leaf descendants do (bax CategoryAttributesPanel). */}
      {category.leaf && (
        <>
          <Divider sx={{ my: 2 }} />
          <CategoryAttributesPanel categoryId={category.id} canEdit={canEdit} />
        </>
      )}
    </Box>
  );
}

function ProductNodeDetails({ productId }: { productId: string }) {
  const { openProduct } = useEntityView();
  const productQuery = useProduct(productId);

  if (productQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Məhsul məlumatları yüklənə bilmədi.</Typography>
      </Box>
    );
  }

  const product = productQuery.data;

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {product.name}
        </Typography>
        <Button size="small" onClick={() => openProduct(product.id)} startIcon={<LaunchRoundedIcon />}>
          Məhsula bax
        </Button>
      </Stack>

      <StatusBadge active={product.active} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Kod" value={product.code} />

      <Divider sx={{ my: 2 }} />

      {/* Read-only by design — attribute linking is a category-level
          configuration action (bax CategoryAttributesPanel), it doesn't
          apply to an individual product's already-fixed attribute values. */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Xüsusiyyətlər
      </Typography>
      <ProductAttributesReadOnly productId={product.id} />
    </Box>
  );
}
