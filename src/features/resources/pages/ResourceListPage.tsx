import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Button from '@mui/material/Button';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { canWrite } from '../../../shared/lib/permissions';
import { ResourceFormDialog } from '../components/ResourceFormDialog';
import { ResourceSearchFilters } from '../components/ResourceSearchFilters';
import { ResourceSearchGrid } from '../components/ResourceSearchGrid';
import { useCreateResource } from '../hooks/useCreateResource';
import { useResourceSearchParams } from '../hooks/useResourceSearchParams';
import { useUpdateResource } from '../hooks/useUpdateResource';
import type { Resource, ResourceFormValues } from '../types/resource.types';

export function ResourceListPage() {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);

  const { params, updateParams } = useResourceSearchParams();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; resource: Resource | null }>({
    open: false,
    mode: 'create',
    resource: null,
  });

  function closeDialog() {
    setDialog({ open: false, mode: 'create', resource: null });
  }

  function handleSubmit(values: ResourceFormValues, onError: (error: unknown) => void) {
    if (dialog.mode === 'edit' && dialog.resource) {
      updateMutation.mutate(
        { id: dialog.resource.id, payload: values },
        { onSuccess: closeDialog, onError },
      );
    } else {
      createMutation.mutate(values, { onSuccess: closeDialog, onError });
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Resurslar"
        subtitle="Materiallar, maşın-mexanizmlər, işçi qüvvəsi, nəqliyyat və xidmətlər"
        actions={
          canEdit ? (
            <Button
              startIcon={<AddRoundedIcon />}
              variant="contained"
              onClick={() => setDialog({ open: true, mode: 'create', resource: null })}
            >
              Yeni resurs
            </Button>
          ) : undefined
        }
      />

      <ResourceSearchFilters
        name={params.name}
        code={params.code}
        category={params.category}
        manufacturer={params.manufacturer}
        brand={params.brand}
        unit={params.unit}
        status={params.status}
        onChange={updateParams}
      />

      <ResourceSearchGrid
        params={params}
        onParamsChange={updateParams}
        onEdit={(resource) => setDialog({ open: true, mode: 'edit', resource })}
        canEdit={canEdit}
      />

      {canEdit && (
        <ResourceFormDialog
          open={dialog.open}
          mode={dialog.mode}
          editValues={
            dialog.resource
              ? {
                  categoryId: dialog.resource.categoryId,
                  code: dialog.resource.code,
                  name: dialog.resource.name,
                  description: dialog.resource.description ?? '',
                  unitId: dialog.resource.unitId,
                  specification: dialog.resource.specification ?? '',
                  manufacturer: dialog.resource.manufacturer ?? '',
                  brand: dialog.resource.brand ?? '',
                  model: dialog.resource.model ?? '',
                  active: dialog.resource.active,
                }
              : null
          }
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </PageContainer>
  );
}
