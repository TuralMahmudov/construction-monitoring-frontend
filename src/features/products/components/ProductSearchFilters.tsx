import { useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useUnitOptions } from '../../reference-data/hooks/useReferenceOptions';
import { CategoryTreeFilterPicker } from '../../resource-categories/components/CategoryTreeFilterPicker';
import type { ProductSearchParams } from '../types/product.types';

export interface ProductSearchFiltersProps {
  category?: string;
  name?: string;
  code?: string;
  unit?: string;
  active?: boolean;
  onChange: (patch: Partial<ProductSearchParams>) => void;
}

const FILTER_KEYS = ['category', 'name', 'code', 'unit', 'active'] as const;

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
  const values = { category, name, code, unit, active };
  const activeFilterCount = FILTER_KEYS.filter((key) => values[key] !== undefined).length;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: isSmallScreen ? 1 : 0 }}>
        {isSmallScreen && (
          <Button
            startIcon={<FilterListRoundedIcon />}
            endIcon={
              <ExpandMoreRoundedIcon
                sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            }
            onClick={() => setExpanded((prev) => !prev)}
          >
            Filtrlər{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        )}
        {!isSmallScreen && activeFilterCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            {activeFilterCount} aktiv filtr
          </Typography>
        )}
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={() =>
              onChange({ category: undefined, name: undefined, code: undefined, unit: undefined, active: undefined })
            }
          >
            Təmizlə
          </Button>
        )}
      </Stack>
      <Collapse in={expanded || !isSmallScreen}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 2fr 1fr' },
            gap: 2,
            pb: 1,
            pt: isSmallScreen ? 0 : 2,
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Kod"
              fullWidth
              size="small"
              value={code ?? ''}
              onChange={(event) => onChange({ code: event.target.value || undefined })}
            />
            <TextField
              label="Ad"
              fullWidth
              size="small"
              value={name ?? ''}
              onChange={(event) => onChange({ name: event.target.value || undefined })}
            />
          </Stack>
          <CategoryTreeFilterPicker
            value={category ?? null}
            onChange={(id) => onChange({ category: id ?? undefined })}
          />
          <Stack spacing={2}>
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
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
