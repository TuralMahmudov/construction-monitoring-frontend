import type { ReactNode } from 'react';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusBadge } from '../../../shared/components';
import { useCategory } from '../hooks/useCategory';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { getCategoryTypeLabel } from '../types/resourceCategory.types';

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

function formatAuditDate(value: string): string {
  return new Date(value).toLocaleString('az-AZ');
}

export function CategoryDetailsPanel() {
  const selectedId = useCategoryUiStore((state) => state.selectedId);
  const openEditDrawer = useCategoryUiStore((state) => state.openEditDrawer);
  const query = useCategory(selectedId);

  if (!selectedId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Ətraflı məlumat üçün ağacdan bir kateqoriya seçin.
        </Typography>
      </Box>
    );
  }

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
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {category.name}
        </Typography>
        <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openEditDrawer(category)}>
          Redaktə et
        </Button>
      </Stack>

      <StatusBadge active={category.active} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Kod" value={category.code} />
      <DetailRow label="Növ" value={getCategoryTypeLabel(category.type)} />
      <DetailRow label="Səviyyə" value={category.level} />
      <DetailRow label="Sıra nömrəsi" value={category.sortOrder} />
      <DetailRow label="Son element" value={category.leaf ? 'Bəli' : 'Xeyr'} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Yaradılıb" value={formatAuditDate(category.createdDate)} />
      <DetailRow label="Yaradan" value={category.createdBy} />
      <DetailRow
        label="Dəyişdirilib"
        value={category.modifiedDate ? formatAuditDate(category.modifiedDate) : '—'}
      />
      <DetailRow label="Dəyişdirən" value={category.modifiedBy ?? '—'} />
    </Box>
  );
}
