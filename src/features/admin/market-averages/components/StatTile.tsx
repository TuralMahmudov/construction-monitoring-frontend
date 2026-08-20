import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export interface StatTileProps {
  label: string;
  value: string | number;
  color?: 'success.main' | 'warning.main' | 'error.main' | 'text.primary';
  // Optional — when provided the tile becomes a toggle-able filter button
  // (bax MarketAveragesPage KPI kartları → variabilityLevel), otherwise it
  // stays a plain read-only stat like before.
  onClick?: () => void;
  selected?: boolean;
}

export function StatTile({ label, value, color = 'text.primary', onClick, selected }: StatTileProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        flex: 1,
        minWidth: 160,
        borderColor: selected ? color : undefined,
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? 'action.selected' : undefined,
      }}
    >
      <CardContent
        component={onClick ? ButtonBase : 'div'}
        onClick={onClick}
        sx={{ width: '100%', textAlign: 'left', display: 'block', cursor: onClick ? 'pointer' : 'default' }}
      >
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
