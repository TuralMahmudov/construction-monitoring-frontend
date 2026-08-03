import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export interface StatTileProps {
  label: string;
  value: string | number;
  color?: 'success.main' | 'warning.main' | 'error.main' | 'text.primary';
}

export function StatTile({ label, value, color = 'text.primary' }: StatTileProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, flex: 1, minWidth: 160 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
