import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { ReferenceDataListPage } from '../components/ReferenceDataListPage';
import { SupplierFormDialog } from '../components/SupplierFormDialog';
import { suppliersHooks } from '../hooks/useSuppliersData';
import type { SupplierFormValues, SupplierItem } from '../types/referenceData.types';

const columns: GridColDef<SupplierItem>[] = [
  { field: 'code', headerName: 'Kod', width: 160 },
  { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
  {
    field: 'active',
    headerName: 'Status',
    width: 120,
    sortable: false,
    renderCell: (params) => <StatusBadge active={params.row.active} />,
  },
];

export function SuppliersPage() {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);

  const createMutation = suppliersHooks.useCreate();
  const updateMutation = suppliersHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; item: SupplierItem | null }>({
    open: false,
    mode: 'create',
    item: null,
  });

  function closeDialog() {
    setDialog({ open: false, mode: 'create', item: null });
  }

  function handleSubmit(values: SupplierFormValues, onError: (error: unknown) => void) {
    if (dialog.mode === 'edit' && dialog.item) {
      updateMutation.mutate(
        { id: dialog.item.id, payload: values },
        { onSuccess: closeDialog, onError },
      );
    } else {
      createMutation.mutate(values, { onSuccess: closeDialog, onError });
    }
  }

  return (
    <>
      <ReferenceDataListPage
        title="Təchizatçılar"
        subtitle="Resurs qiymətləri üçün təchizatçılar"
        entityLabelSingular="təchizatçı"
        columns={columns}
        hooks={suppliersHooks}
        canEdit={canEdit}
        onAdd={() => setDialog({ open: true, mode: 'create', item: null })}
        onEdit={(item) => setDialog({ open: true, mode: 'edit', item })}
      />

      {canEdit && (
        <SupplierFormDialog
          open={dialog.open}
          mode={dialog.mode}
          title={dialog.mode === 'edit' ? 'Təchizatçını redaktə et' : 'Yeni təchizatçı'}
          editValues={
            dialog.item
              ? { code: dialog.item.code, name: dialog.item.name, active: dialog.item.active }
              : null
          }
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
