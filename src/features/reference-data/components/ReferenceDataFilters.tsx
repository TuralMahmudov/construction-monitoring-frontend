import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DebouncedTextField } from '../../../shared/components';

export interface ReferenceDataFiltersProps {
  code?: string;
  name?: string;
  active?: boolean;
  /** Units/Regions dropped their `code` column (2026-07-31) — Suppliers kept
   *  theirs, so this defaults to shown and only Units/Regions opt out. */
  showCodeFilter?: boolean;
  onChange: (patch: { code?: string; name?: string; active?: boolean }) => void;
}

export function ReferenceDataFilters({
  code,
  name,
  active,
  showCodeFilter = true,
  onChange,
}: ReferenceDataFiltersProps) {
  const statusValue = active === undefined ? '' : active ? 'true' : 'false';

  return (
    <Grid container spacing={2} sx={{ pb: 1 }}>
      {showCodeFilter && (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <DebouncedTextField
            label="Kod"
            fullWidth
            size="small"
            value={code ?? ''}
            onChange={(value) => onChange({ code: value || undefined })}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <DebouncedTextField
          label="Ad"
          fullWidth
          size="small"
          value={name ?? ''}
          onChange={(value) => onChange({ name: value || undefined })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <TextField
          select
          label="Status"
          fullWidth
          size="small"
          value={statusValue}
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
  );
}
