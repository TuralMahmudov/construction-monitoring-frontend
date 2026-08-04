import { useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../../hooks/useAuth';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { canApprovePrices, canWrite, isCentralAdmin } from '../../../../shared/lib/permissions';
import type { ResourcePrice, ResourcePriceFormValues } from '../types/resourcePrice.types';
import { groupCurrentPrices } from '../utils/groupCurrentPrices';
import {
  useApproveResourcePrice,
  useCreateResourcePrice,
  useRejectResourcePrice,
  useResourcePriceHistory,
  useUpdateResourcePrice,
} from '../hooks/useResourcePrices';
import { CurrentPricesTable } from './CurrentPricesTable';
import { PriceFormDialog } from './PriceFormDialog';
import { PriceHistoryTable } from './PriceHistoryTable';

export interface ResourcePricesTabProps {
  resourceId: string;
}

export function ResourcePricesTab({ resourceId }: ResourcePricesTabProps) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const canApprove = canApprovePrices(user?.roles ?? []);
  const isAdmin = isCentralAdmin(user?.roles ?? []);
  // FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 3 — the server
  // hard-rejects a price submission from a CENTRAL (organizationId=null)
  // account with 400, so the create button/form must not be offered to them
  // in the first place, not just rely on the 400 surfacing.
  const canCreatePrice = canEdit && Boolean(user?.organizationId);

  const historyQuery = useResourcePriceHistory(resourceId);
  const createMutation = useCreateResourcePrice(resourceId);
  const updateMutation = useUpdateResourcePrice(resourceId);
  const approveMutation = useApproveResourcePrice(resourceId);
  const rejectMutation = useRejectResourcePrice(resourceId);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    price: ResourcePrice | null;
  }>({ open: false, mode: 'create', price: null });

  function closeDialog() {
    setDialog({ open: false, mode: 'create', price: null });
  }

  function handleSubmit(values: ResourcePriceFormValues, onError: (error: unknown) => void) {
    if (dialog.mode === 'edit' && dialog.price) {
      updateMutation.mutate(
        { id: dialog.price.id, payload: values },
        { onSuccess: closeDialog, onError },
      );
    } else {
      createMutation.mutate(values, { onSuccess: closeDialog, onError });
    }
  }

  const prices = useMemo(
    () => [...(historyQuery.data?.content ?? [])].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    [historyQuery.data],
  );
  const currentEntries = useMemo(() => groupCurrentPrices(prices), [prices]);

  if (historyQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (historyQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(historyQuery.error)}</Alert>;
  }

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Cari Qiymətlər (təşkilat/region üzrə)
        </Typography>
        {canCreatePrice && (
          <Button
            startIcon={<AddRoundedIcon />}
            variant="contained"
            size="small"
            onClick={() => setDialog({ open: true, mode: 'create', price: null })}
          >
            Yeni qiymət
          </Button>
        )}
      </Stack>
      <CurrentPricesTable entries={currentEntries} />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Tam Tarixçə
      </Typography>
      <PriceHistoryTable
        prices={prices}
        canEdit={canEdit}
        canApprove={canApprove}
        currentUserId={user?.id ?? null}
        isCentralAdmin={isAdmin}
        onEdit={(price) => setDialog({ open: true, mode: 'edit', price })}
        onApprove={(price) => approveMutation.mutate(price.id)}
        onReject={(price) => rejectMutation.mutate(price.id)}
      />

      {canEdit && (
        <PriceFormDialog
          open={dialog.open}
          mode={dialog.mode}
          editValues={
            dialog.price
              ? {
                  regionId: dialog.price.regionId,
                  price: dialog.price.price,
                  vat: dialog.price.vat,
                  currency: dialog.price.currency,
                  effectiveDate: dialog.price.effectiveDate,
                  expireDate: dialog.price.expireDate,
                  comment: dialog.price.comment ?? '',
                }
              : null
          }
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </Box>
  );
}
