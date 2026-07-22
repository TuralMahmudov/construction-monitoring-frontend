import Chip from '@mui/material/Chip';

export interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <Chip
      label={active ? 'Aktiv' : 'Deaktiv'}
      size="small"
      color={active ? 'success' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
}
