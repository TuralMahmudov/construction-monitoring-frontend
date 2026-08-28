import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, StatusBadge } from '../../../shared/components';
import { canWrite, isOrganizationActor } from '../../../shared/lib/permissions';
import { UnitFormDialog } from '../components/UnitFormDialog';
import { ReferenceDataListPage } from '../components/ReferenceDataListPage';
import { unitsHooks } from '../hooks/useUnitsData';
import type { UnitFormValues, UnitItem } from '../types/referenceData.types';

const columns: GridColDef<UnitItem>[] = [
  { field: 'name', headerName: 'Ad', flex: 1, minWidth: 180 },
  { field: 'symbol', headerName: 'Simvol', width: 120 },
  { field: 'decimalPrecision', headerName: 'Onluq dəqiqlik', width: 150, type: 'number' },
  {
    field: 'active',
    headerName: 'Status',
    width: 120,
    sortable: false,
    renderCell: (params) => <StatusBadge active={params.row.active} />,
  },
];

export function UnitsPage() {
  const { user } = useAuth();
  const canAccess = !isOrganizationActor(user);
  const canEdit = canWrite(user?.roles ?? []);

  const createMutation = unitsHooks.useCreate();
  const updateMutation = unitsHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; item: UnitItem | null }>({
    open: false,
    mode: 'create',
    item: null,
  });

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  function closeDialog() {
    setDialog({ open: false, mode: 'create', item: null });
  }

  function handleSubmit(values: UnitFormValues, onError: (error: unknown) => void) {
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
        title="Vahidlər"
        entityLabelSingular="vahid"
        columns={columns}
        hooks={unitsHooks}
        canEdit={canEdit}
        showCodeFilter={false}
        onAdd={() => setDialog({ open: true, mode: 'create', item: null })}
        onEdit={(item) => setDialog({ open: true, mode: 'edit', item })}
      />

      {canEdit && (
        <UnitFormDialog
          open={dialog.open}
          mode={dialog.mode}
          title={dialog.mode === 'edit' ? 'Vahidi redaktə et' : 'Yeni vahid'}
          editValues={
            dialog.item
              ? {
                  name: dialog.item.name,
                  symbol: dialog.item.symbol ?? '',
                  decimalPrecision: dialog.item.decimalPrecision ?? 2,
                  active: dialog.item.active,
                }
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
