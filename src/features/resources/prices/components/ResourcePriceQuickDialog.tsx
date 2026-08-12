import { useCreateResourcePrice } from '../hooks/useResourcePrices';
import { PriceFormDialog } from './PriceFormDialog';

export interface ResourcePriceQuickDialogProps {
  open: boolean;
  resourceId: string | null;
  resourceLabel: string;
  // The resource's owning organization — required for these callers (see
  // ResourcePriceFormValues comment), since this dialog only ever opens from
  // central-admin-facing screens (Resurslar, Daxil olanlar).
  organizationId: string | null;
  onClose: () => void;
}

// Thin wrapper around the generic PriceFormDialog for callers that add a
// price straight from a table row (ResourceSearchGrid, DocumentResourcesViewDialog)
// instead of from within that resource's own view/tab.
export function ResourcePriceQuickDialog({
  open,
  resourceId,
  resourceLabel,
  organizationId,
  onClose,
}: ResourcePriceQuickDialogProps) {
  const createMutation = useCreateResourcePrice(resourceId ?? '', organizationId);

  return (
    <PriceFormDialog
      open={open}
      mode="create"
      editValues={null}
      isSubmitting={createMutation.isPending}
      subtitle={resourceLabel}
      onClose={onClose}
      onSubmit={(values, onError) => {
        createMutation.mutate(values, { onSuccess: onClose, onError });
      }}
    />
  );
}
