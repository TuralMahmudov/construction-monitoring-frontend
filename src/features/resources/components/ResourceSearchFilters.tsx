import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../../../hooks/useAuth';
import { isCentralAdmin } from '../../../shared/lib/permissions';
import { useOrganizationLookup } from '../../admin/organizations/hooks/useOrganizations';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS } from '../../admin/organizations/types/organization.types';
import { ProductAutocomplete } from '../../products/components/ProductAutocomplete';
import type { Product } from '../../products/types/product.types';
import type { ResourceSearchParams } from '../types/resource.types';

export interface ResourceSearchFiltersProps {
  organization?: string;
  active?: boolean;
  onChange: (patch: Partial<ResourceSearchParams>) => void;
}

// § 3.4 — name/code/category/manufacturer/brand/unit/attribute filters moved
// to GET /api/products (bax ProductSearchFilters); a resource listing is now
// only filterable by which product it points to, which organization it
// belongs to, and its active state.
export function ResourceSearchFilters({ organization, active, onChange }: ResourceSearchFiltersProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(!isSmallScreen);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const canFilterByOrganization = isCentralAdmin(user?.roles ?? []);
  const organizations = useOrganizationLookup(canFilterByOrganization);
  const organizationOptions = Array.from(organizations.values()).sort((a, b) => a.name.localeCompare(b.name));

  const activeValue = active === undefined ? '' : active ? 'true' : 'false';

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
            <ProductAutocomplete
              value={selectedProduct}
              onChange={(product) => {
                setSelectedProduct(product);
                onChange({ product: product?.id ?? undefined });
              }}
            />
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
