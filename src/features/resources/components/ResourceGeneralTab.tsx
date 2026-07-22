import { useState } from 'react';
import type { ReactNode } from 'react';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { ResourceFormDialog } from './ResourceFormDialog';
import { useCategoryNameLookup, useUnitLookup } from '../hooks/useLookups';
import { useUpdateResource } from '../hooks/useUpdateResource';
import type { Resource, ResourceFormValues } from '../types/resource.types';

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

export interface ResourceGeneralTabProps {
  resource: Resource;
}

export function ResourceGeneralTab({ resource }: ResourceGeneralTabProps) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const updateMutation = useUpdateResource();
  const [editOpen, setEditOpen] = useState(false);

  function handleSubmit(values: ResourceFormValues, onError: (error: unknown) => void) {
    updateMutation.mutate(
      { id: resource.id, payload: values },
      { onSuccess: () => setEditOpen(false), onError },
    );
  }

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {resource.name}
        </Typography>
        {canEdit && (
          <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => setEditOpen(true)}>
            Redaktə et
          </Button>
        )}
      </Stack>

      <StatusBadge active={resource.active} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Kod" value={resource.code} />
      <DetailRow label="Kateqoriya" value={categoryNames.get(resource.categoryId) ?? '—'} />
      <DetailRow label="Vahid" value={resource.unitId ? (unitSymbols.get(resource.unitId) ?? '—') : '—'} />
      <DetailRow label="Təsvir" value={resource.description || '—'} />
      <DetailRow label="Spesifikasiya" value={resource.specification || '—'} />
      <DetailRow label="İstehsalçı" value={resource.manufacturer || '—'} />
      <DetailRow label="Brend" value={resource.brand || '—'} />
      <DetailRow label="Model" value={resource.model || '—'} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Yaradılıb" value={formatAuditDate(resource.createdDate)} />
      <DetailRow label="Yaradan" value={resource.createdBy} />
      <DetailRow
        label="Dəyişdirilib"
        value={resource.modifiedDate ? formatAuditDate(resource.modifiedDate) : '—'}
      />
      <DetailRow label="Dəyişdirən" value={resource.modifiedBy ?? '—'} />

      {canEdit && (
        <ResourceFormDialog
          open={editOpen}
          mode="edit"
          editValues={{
            categoryId: resource.categoryId,
            code: resource.code,
            name: resource.name,
            description: resource.description ?? '',
            unitId: resource.unitId,
            specification: resource.specification ?? '',
            manufacturer: resource.manufacturer ?? '',
            brand: resource.brand ?? '',
            model: resource.model ?? '',
            active: resource.active,
          }}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </Box>
  );
}
