import { useState } from 'react';
import type { ReactNode } from 'react';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { useCategoryNameLookup, useUnitLookup } from '../../resources/hooks/useLookups';
import { useProductActiveToggle } from '../hooks/useProductActiveToggle';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { PRODUCT_REVIEW_STATUS, type Product } from '../types/product.types';
import { ProductEditDialog } from './ProductEditDialog';

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

// FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 4 — user IDs have no
// general-purpose name lookup (GET /api/users/{id} 404s for vendor ids). A
// Product (unlike a Resource) has no organizationId to fall back on either —
// it's shared catalog identity, not owned by one org — so there's no
// meaningful name to show here at all; never print the raw UUID, just admit
// it's unknown.
const UNKNOWN_ACTOR = '—';

export interface ProductGeneralTabProps {
  product: Product;
}

export function ProductGeneralTab({ product }: ProductGeneralTabProps) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const updateMutation = useUpdateProduct();
  const activeToggleMutation = useProductActiveToggle();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {product.code} — {product.name}
        </Typography>
        {canEdit && (
          <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => setEditOpen(true)}>
            Redaktə et
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1}>
        <StatusBadge active={product.active} />
        {product.reviewStatus === PRODUCT_REVIEW_STATUS.PENDING_REVIEW && (
          <Chip size="small" color="warning" label="Baxış gözləyir" />
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Kod" value={product.code} />
      <DetailRow label="Kateqoriya" value={categoryNames.get(product.categoryId) ?? '—'} />
      <DetailRow label="Vahid" value={product.unitId ? (unitSymbols.get(product.unitId) ?? '—') : '—'} />
      <DetailRow label="Təsvir" value={product.description || '—'} />

      <Divider sx={{ my: 2 }} />

      <DetailRow label="Yaradılıb" value={formatAuditDate(product.createdDate)} />
      <DetailRow label="Yaradan" value={UNKNOWN_ACTOR} />
      <DetailRow
        label="Dəyişdirilib"
        value={product.modifiedDate ? formatAuditDate(product.modifiedDate) : '—'}
      />
      <DetailRow label="Dəyişdirən" value={UNKNOWN_ACTOR} />

      {canEdit && (
        <>
          <Divider sx={{ my: 2 }} />
          {/* § 2.3 — enable/disable only hides the product from the catalog
              for NEW listings, existing resources referencing it stay as-is. */}
          <Button
            color={product.active ? 'error' : 'success'}
            onClick={() => activeToggleMutation.mutate({ id: product.id, active: !product.active })}
            disabled={activeToggleMutation.isPending}
          >
            {product.active ? 'Kataloqdan gizlət' : 'Kataloqa qaytar'}
          </Button>
        </>
      )}

      {canEdit && (
        <ProductEditDialog
          open={editOpen}
          product={product}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditOpen(false)}
          onSubmit={(values, onError) =>
            updateMutation.mutate(
              { id: product.id, payload: values },
              { onSuccess: () => setEditOpen(false), onError },
            )
          }
        />
      )}
    </Box>
  );
}
