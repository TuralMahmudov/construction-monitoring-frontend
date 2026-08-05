import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../../../hooks/useAuth';
import { isCentralAdmin } from '../../../shared/lib/permissions';
import { useOrganizationLookup } from '../../admin/organizations/hooks/useOrganizations';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS } from '../../admin/organizations/types/organization.types';
import { useAllRegions } from '../../reference-data/hooks/useReferenceOptions';
import type { ResourceSearchParams } from '../types/resource.types';

export interface ResourceSearchFiltersProps {
  organization?: string;
  active?: boolean;
  name?: string;
  code?: string;
  regionId?: string;
  minPrice?: number;
  maxPrice?: number;
  onChange: (patch: Partial<ResourceSearchParams>) => void;
}

// § 3.4 (product filters) + § 7.1 (2026-08-04, resurs filtrləri) — a resource
// listing is filterable by name/code (contains, replaces the old exact
// product-autocomplete filter), which organization it belongs to, its active
// state, and — given a region — its current active price range. minPrice/
// maxPrice without regionId is a server 400 (no cross-currency comparison in
// this system), so those fields stay disabled until a region is picked,
// matching the backend contract.
export function ResourceSearchFilters({
  organization,
  active,
  name,
  code,
  regionId,
  minPrice,
  maxPrice,
  onChange,
}: ResourceSearchFiltersProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(!isSmallScreen);
  const { user } = useAuth();
  const canFilterByOrganization = isCentralAdmin(user?.roles ?? []);
  const organizations = useOrganizationLookup(canFilterByOrganization);
  const organizationOptions = Array.from(organizations.values()).sort((a, b) => a.name.localeCompare(b.name));
  const regionsQuery = useAllRegions();

  const activeValue = active === undefined ? '' : active ? 'true' : 'false';
  const hasRegion = Boolean(regionId);

  return (
    <Box>
      {isSmallScreen && (
        <Button
          startIcon={<FilterListRoundedIcon />}
          endIcon={
            <ExpandMoreRoundedIcon
              sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          }
          onClick={() => setExpanded((prev) => !prev)}
          sx={{ mb: 1 }}
        >
          Filtrlər
        </Button>
      )}
      <Collapse in={expanded || !isSmallScreen}>
        <Grid container spacing={2} sx={{ pb: 1 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={activeValue}
              onChange={(event) =>
                onChange({ active: event.target.value === '' ? undefined : event.target.value === 'true' })
              }
            >
              <MenuItem value="">Hamısı</MenuItem>
              <MenuItem value="true">Aktiv</MenuItem>
              <MenuItem value="false">Deaktiv</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Ad"
              fullWidth
              size="small"
              value={name ?? ''}
              onChange={(event) => onChange({ name: event.target.value || undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Kod"
              fullWidth
              size="small"
              value={code ?? ''}
              onChange={(event) => onChange({ code: event.target.value || undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Region"
              fullWidth
              size="small"
              value={regionId ?? ''}
              disabled={regionsQuery.isLoading}
              onChange={(event) => {
                const newRegionId = event.target.value || undefined;
                // Region cleared → the min/max price filters become invalid
                // (server 400s without regionId), so drop them too.
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
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Stack spacing={2}>
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
          </Grid>
          {canFilterByOrganization && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                options={organizationOptions}
                getOptionLabel={(option) => `${option.name} ${ORGANIZATION_TYPE_ICONS[option.type]} ${ORGANIZATION_TYPE_LABELS[option.type]}`}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                value={organizationOptions.find((org) => org.id === organization) ?? null}
                onChange={(_event, newValue) => onChange({ organization: newValue?.id ?? undefined })}
                size="small"
                renderInput={(params) => <TextField {...params} label="Təşkilat" />}
              />
            </Grid>
          )}
        </Grid>
      </Collapse>
    </Box>
  );
}
