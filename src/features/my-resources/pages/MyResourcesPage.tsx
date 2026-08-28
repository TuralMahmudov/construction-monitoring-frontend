import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useSnackbar } from 'notistack';
import { PageContainer, PageHeader } from '../../../shared/components';
import { createMyResourcePrice } from '../api/myResourcePricesApi';
import { useCreateMyResource } from '../hooks/useCreateMyResource';
import { MyResourceFormDialog } from '../components/MyResourceFormDialog';
import { MyResourcePriceQuickDialog } from '../components/MyResourcePriceQuickDialog';
import { MyResourceSearchFilters } from '../components/MyResourceSearchFilters';
import { MyResourceTable } from '../components/MyResourceTable';
import { MyResourceViewDialog } from '../components/MyResourceViewDialog';
import type { CreateMyResourceRequest, MyResource, MyResourceSearchParams } from '../types/myResource.types';
import type { MyResourcePriceFormValues } from '../types/price.types';

const DEFAULT_PARAMS = { page: 0, size: 10 } satisfies MyResourceSearchParams;

export function MyResourcesPage() {
  const [params, setParams] = useState<MyResourceSearchParams>(DEFAULT_PARAMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<MyResource | null>(null);
  const [priceTarget, setPriceTarget] = useState<MyResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateMyResource();

  function updateParams(patch: Partial<MyResourceSearchParams>) {
    setParams((prev) => ({ ...prev, ...patch }));
  }

  // § 4 — attributes now travel inside the same POST /api/resources/mine
  // call (the backend resolves/creates the product internally), so only
  // prices need a separate per-row request afterwards.
  async function handleSubmit(
    values: CreateMyResourceRequest,
    priceEntries: MyResourcePriceFormValues[],
    onError: (error: unknown) => void,
  ) {
    setIsSubmitting(true);
    try {
      const resource = await createMutation.mutateAsync(values);

      let priceFailures = 0;
      for (const entry of priceEntries) {
        try {
          await createMyResourcePrice(resource.id, entry);
        } catch {
          priceFailures += 1;
        }
      }

      if (priceFailures > 0) {
        enqueueSnackbar(
          `Resurs (${resource.code}) yaradıldı, amma ${priceFailures} qiymət əlavə olunmadı — resursu açıb əl ilə əlavə edin.`,
          { variant: 'warning' },
        );
      }
      setCreateOpen(false);
    } catch (error) {
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Mənim Resurslarım"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
            Yeni Resurs
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <MyResourceSearchFilters
            name={params.name}
            code={params.code}
            status={params.status}
            regionId={params.regionId}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
            hasPrice={params.hasPrice}
            onChange={updateParams}
          />
        </CardContent>
      </Card>

      <Card>
        <MyResourceTable
          params={{ page: params.page ?? 0, size: params.size ?? 10, ...params }}
          onParamsChange={updateParams}
          onView={(resource) => setViewTarget(resource)}
          onManagePrice={(resource) => setPriceTarget(resource)}
        />
      </Card>

      <MyResourceFormDialog
        open={createOpen}
        isSubmitting={isSubmitting}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmit}
      />

      <MyResourceViewDialog
        open={viewTarget !== null}
        resourceId={viewTarget?.id ?? null}
        onClose={() => setViewTarget(null)}
      />

      <MyResourcePriceQuickDialog
        open={priceTarget !== null}
        resourceId={priceTarget?.id ?? null}
        resourceName={priceTarget?.name ?? ''}
        onClose={() => setPriceTarget(null)}
      />
    </PageContainer>
  );
}
