import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { CategoryPathAutocomplete } from '../../resources/components/CategoryPathAutocomplete';
import type { ProductSearchParams } from '../types/product.types';

export interface ProductSearchFiltersProps {
  category?: string;
  name?: string;
  code?: string;
  unit?: string;
  active?: boolean;
  onChange: (patch: Partial<ProductSearchParams>) => void;
}

export function ProductSearchFilters({
  category,
  name,
  code,
  unit,
  active,
  onChange,
}: ProductSearchFiltersProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(!isSmallScreen);
  const unitOptions = useUnitOptions();

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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Ad"
              fullWidth
              size="small"
              value={name ?? ''}
              onChange={(event) => onChange({ name: event.target.value || undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Kod"
              fullWidth
              size="small"
              value={code ?? ''}
              onChange={(event) => onChange({ code: event.target.value || undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CategoryPathAutocomplete
              value={category ?? null}
              onChange={(id) => onChange({ category: id ?? undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Vahid"
              fullWidth
              size="small"
              value={unit ?? ''}
              onChange={(event) => onChange({ unit: event.target.value || undefined })}
            >
              <MenuItem value="">Hamısı</MenuItem>
              {(unitOptions.data?.content ?? []).map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.symbol || option.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        </Grid>
      </Collapse>
    </Box>
  );
}
