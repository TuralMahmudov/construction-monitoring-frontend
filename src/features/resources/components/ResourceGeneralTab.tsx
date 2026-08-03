import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { useCategoryNameLookup, useUnitLookup } from '../hooks/useLookups';
import { useUpdateResource } from '../hooks/useUpdateResource';
import type { Resource } from '../types/resource.types';
import { OrganizationChip } from './OrganizationChip';
import { ResourceEditDialog } from './ResourceEditDialog';

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

// § 3.2 — code/name/attribut/unit all read from resource.product.*, never
// resource.* directly (those fields no longer exist on the listing itself).
export function ResourceGeneralTab({ resource }: ResourceGeneralTabProps) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const updateMutation = useUpdateResource();
  const [active, setActive] = useState(resource.active);
  const [editOpen, setEditOpen] = useState(false);

  function handleToggleActive() {
    const nextActive = !active;
    updateMutation.mutate(
      { id: resource.id, payload: { active: nextActive } },
      { onSuccess: () => setActive(nextActive) },
    );
  }

  const product = resource.product;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {product.code} — {product.name}
        </Typography>
        <Stack direction="row" spacing={1}>
          {canEdit && (
            <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => setEditOpen(true)}>
              Redaktə et
            </Button>
          )}
          <Button
            size="small"
            component={RouterLink}
            to={`/products/${product.id}`}
            startIcon={<LaunchRoundedIcon />}
          >
            Məhsula bax
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1}>
        <StatusBadge active={resource.active} />
        <OrganizationChip organizationId={resource.organizationId} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Kod" value={product.code} />
      <DetailRow label="Kateqoriya" value={categoryNames.get(product.categoryId) ?? '—'} />
      <DetailRow label="Vahid" value={product.unitId ? (unitSymbols.get(product.unitId) ?? '—') : '—'} />
      <DetailRow label="Təsvir" value={product.description || '—'} />
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
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            startIcon={<EditRoundedIcon />}
            color={active ? 'error' : 'success'}
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {active ? 'Deaktiv et' : 'Aktivləşdir'}
          </Button>
        </>
      )}

      {canEdit && (
        <ResourceEditDialog
          open={editOpen}
          resource={resource}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={(values, onError) =>
            updateMutation.mutate(
              { id: resource.id, payload: values },
              {
                onSuccess: () => {
                  setActive(values.active);
                  setEditOpen(false);
                },
                onError,
              },
            )
          }
        />
      )}
    </Box>
  );
}
