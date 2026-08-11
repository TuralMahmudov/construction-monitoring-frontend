import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface StatusBadgeProps {
  active: boolean;
}

// A saturated filled Chip on every row is the heaviest element on the page
// even though active/inactive is usually the least informative column (most
// rows are active) — a dot + label reads the same information at a glance
// without dominating the grid.
export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
      <CircleRoundedIcon sx={{ fontSize: 10, color: active ? 'success.main' : 'text.disabled' }} />
      <Typography variant="body2" color={active ? 'text.primary' : 'text.secondary'}>
        {active ? 'Aktiv' : 'Deaktiv'}
      </Typography>
    </Stack>
  );
}
