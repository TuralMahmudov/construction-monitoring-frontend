import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { DebouncedTextField } from '../../../shared/components';
import { useAllRegions } from '../../reference-data/hooks/useReferenceOptions';
import {
  RESOURCE_STATUS,
  RESOURCE_STATUS_LABELS,
  type MyResourceSearchParams,
  type ResourceStatus,
} from '../types/myResource.types';

const STATUS_OPTIONS = Object.values(RESOURCE_STATUS);

export interface MyResourceSearchFiltersProps {
  name?: string;
  code?: string;
  status?: ResourceStatus;
  regionId?: string;
  minPrice?: number;
  maxPrice?: number;
  hasPrice?: boolean;
  onChange: (patch: Partial<MyResourceSearchParams>) => void;
}

// Same filter set as ResourceSearchFilters (bax resources/components/
// ResourceSearchFilters.tsx) minus "Təşkilat" — every row here already
// belongs to the current user's own organization, so that filter is
// meaningless on this screen. Layout is 3 columns of 2 stacked fields each
// (Tural, 2026-08-05), not one field per column like ResourceSearchFilters.
export function MyResourceSearchFilters({
  name,
  code,
  status,
  regionId,
  minPrice,
  maxPrice,
  hasPrice,
  onChange,
}: MyResourceSearchFiltersProps) {
  const regionsQuery = useAllRegions();
  const hasRegion = Boolean(regionId);
  const hasPriceValue = hasPrice === undefined ? '' : hasPrice ? 'true' : 'false';

  return (
    <Grid container spacing={2} sx={{ pb: 1 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <TextField
            select
            label="Status"
            fullWidth
            size="small"
            value={status ?? ''}
            onChange={(event) =>
              onChange({ status: event.target.value === '' ? undefined : (Number(event.target.value) as ResourceStatus) })
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            {STATUS_OPTIONS.map((value) => (
              <MenuItem key={value} value={value}>
                {RESOURCE_STATUS_LABELS[value]}
              </MenuItem>
            ))}
          </TextField>
          <DebouncedTextField
            label="Ad"
            fullWidth
            size="small"
            value={name ?? ''}
            onChange={(value) => onChange({ name: value || undefined })}
          />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <DebouncedTextField
            label="Kod"
            fullWidth
            size="small"
            value={code ?? ''}
            onChange={(value) => onChange({ code: value || undefined })}
          />
          <TextField
            select
            label="Qiymət əlavə olunub"
            fullWidth
            size="small"
            value={hasPriceValue}
            onChange={(event) =>
              onChange({ hasPrice: event.target.value === '' ? undefined : event.target.value === 'true' })
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            <MenuItem value="true">Bəli</MenuItem>
            <MenuItem value="false">Xeyr</MenuItem>
          </TextField>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Qiymət (min)"
              type="number"
              fullWidth
              size="small"
              value={minPrice ?? ''}
              disabled={!hasRegion}
              helperText={!hasRegion ? 'Əvvəlcə region seçin' : undefined}
              onChange={(event) => onChange({ minPrice: event.target.value === '' ? undefined : Number(event.target.value) })}
            />
            <TextField
              label="Qiymət (maks)"
              type="number"
              fullWidth
              size="small"
              value={maxPrice ?? ''}
              disabled={!hasRegion}
              helperText={!hasRegion ? 'Əvvəlcə region seçin' : undefined}
              onChange={(event) => onChange({ maxPrice: event.target.value === '' ? undefined : Number(event.target.value) })}
            />
          </Stack>
          <TextField
            select
            label="Region"
            fullWidth
            size="small"
            value={regionId ?? ''}
            disabled={regionsQuery.isLoading}
            onChange={(event) => {
              const newRegionId = event.target.value || undefined;
              onChange(
                newRegionId ? { regionId: newRegionId } : { regionId: undefined, minPrice: undefined, maxPrice: undefined },
              );
            }}
          >
            <MenuItem value="">Bütün regionlar</MenuItem>
            {(regionsQuery.data?.content ?? []).map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Grid>
    </Grid>
  );
}
