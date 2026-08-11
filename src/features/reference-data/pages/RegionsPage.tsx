import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, StatusBadge } from '../../../shared/components';
import { canWrite, isOrganizationActor } from '../../../shared/lib/permissions';
import { ReferenceDataListPage } from '../components/ReferenceDataListPage';
import { RegionFormDialog } from '../components/RegionFormDialog';
import { regionsHooks } from '../hooks/useRegionsData';
import type { BaseReferenceFormValues, RegionItem } from '../types/referenceData.types';

const columns: GridColDef<RegionItem>[] = [
  { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
  {
    field: 'active',
    headerName: 'Status',
    width: 120,
    sortable: false,
    renderCell: (params) => <StatusBadge active={params.row.active} />,
  },
];

export function RegionsPage() {
  const { user } = useAuth();
  const canAccess = !isOrganizationActor(user);
  const canEdit = canWrite(user?.roles ?? []);

  const createMutation = regionsHooks.useCreate();
  const updateMutation = regionsHooks.useUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; item: RegionItem | null }>({
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

  function handleSubmit(values: BaseReferenceFormValues, onError: (error: unknown) => void) {
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
        title="Regionlar"
        subtitle="Qiymətləndirmə üçün coğrafi regionlar"
        entityLabelSingular="region"
        columns={columns}
        hooks={regionsHooks}
        canEdit={canEdit}
        showCodeFilter={false}
        onAdd={() => setDialog({ open: true, mode: 'create', item: null })}
        onEdit={(item) => setDialog({ open: true, mode: 'edit', item })}
      />

      {canEdit && (
        <RegionFormDialog
          open={dialog.open}
          mode={dialog.mode}
          title={dialog.mode === 'edit' ? 'Regionu redaktə et' : 'Yeni region'}
          editValues={
            dialog.item ? { name: dialog.item.name, active: dialog.item.active } : null
          }
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
