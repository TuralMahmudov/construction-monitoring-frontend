import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export interface ReferenceDataFiltersProps {
  code?: string;
  name?: string;
  active?: boolean;
  onChange: (patch: { code?: string; name?: string; active?: boolean }) => void;
}

export function ReferenceDataFilters({ code, name, active, onChange }: ReferenceDataFiltersProps) {
  const statusValue = active === undefined ? '' : active ? 'true' : 'false';

  return (
    <Grid container spacing={2} sx={{ pb: 1 }}>
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
          label="Ad"
          fullWidth
          size="small"
          value={name ?? ''}
          onChange={(event) => onChange({ name: event.target.value || undefined })}
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
