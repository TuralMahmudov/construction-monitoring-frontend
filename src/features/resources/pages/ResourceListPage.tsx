import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { canWrite, isCentralAdmin } from '../../../shared/lib/permissions';
import { ResourceFormDialog } from '../components/ResourceFormDialog';
import { ResourceSearchFilters } from '../components/ResourceSearchFilters';
import { ResourceSearchGrid } from '../components/ResourceSearchGrid';
import { useCreateResource } from '../hooks/useCreateResource';
import { useResourceSearchParams } from '../hooks/useResourceSearchParams';
import type { ResourceCreateRequest } from '../types/resource.types';

export function ResourceListPage() {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const canViewAllOrganizations = isCentralAdmin(user?.roles ?? []);

  const { params, updateParams } = useResourceSearchParams();
  const createMutation = useCreateResource();

  const [createOpen, setCreateOpen] = useState(false);

  function handleSubmit(values: ResourceCreateRequest, onError: (error: unknown) => void) {
    createMutation.mutate(values, { onSuccess: () => setCreateOpen(false), onError });
  }

  return (
    <PageContainer>
      {/* 2026-08-13 (Tural) — "Elan Yarat" hidden for now, not needed yet.
          Dialog/flow stays in the code, just unreachable from this button. */}
      <PageHeader title="Resurslar" subtitle="Təşkilatların elan etdiyi məhsullar" />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {canViewAllOrganizations
          ? 'Bütün təşkilatların məlumatları göstərilir (mərkəzi baxış).'
          : 'Yalnız öz təşkilatınızın və ümumi resurslar göstərilir.'}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ResourceSearchFilters
            organization={params.organization}
            active={params.active}
            name={params.name}
            code={params.code}
            regionId={params.regionId}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
            createdFrom={params.createdFrom}
            createdTo={params.createdTo}
            onChange={updateParams}
          />
        </CardContent>
      </Card>

      <Card>
        <ResourceSearchGrid params={params} onParamsChange={updateParams} />
      </Card>

      {canEdit && (
        <ResourceFormDialog
          open={createOpen}
          isSubmitting={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </PageContainer>
  );
}
