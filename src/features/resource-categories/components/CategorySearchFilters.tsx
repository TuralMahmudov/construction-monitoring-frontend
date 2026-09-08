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
import { DebouncedTextField } from '../../../shared/components';
import { CATEGORY_TYPES, getCategoryTypeLabel } from '../types/resourceCategory.types';
import type { CategorySearchParams, CategoryStatusFilter } from '../types/resourceCategory.types';

export interface CategorySearchFiltersProps {
  name?: string;
  status: CategoryStatusFilter;
  type?: number;
  onChange: (patch: Partial<CategorySearchParams>) => void;
}

const STATUS_OPTIONS: { value: CategoryStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Hamısı' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'INACTIVE', label: 'Deaktiv' },
];

export function CategorySearchFilters({
  name,
  status,
  type,
  onChange,
}: CategorySearchFiltersProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(!isSmallScreen);

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
            <DebouncedTextField
              label="Ad"
              fullWidth
              size="small"
              value={name ?? ''}
              onChange={(value) => onChange({ name: value || undefined })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={status}
              onChange={(event) => onChange({ status: event.target.value as CategoryStatusFilter })}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Növ"
              fullWidth
              size="small"
              value={type ?? ''}
              onChange={(event) =>
                onChange({ type: event.target.value ? Number(event.target.value) : undefined })
              }
            >
              <MenuItem value="">Hamısı</MenuItem>
              {CATEGORY_TYPES.map((categoryType) => (
                <MenuItem key={categoryType} value={categoryType}>
                  {getCategoryTypeLabel(categoryType)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
}
