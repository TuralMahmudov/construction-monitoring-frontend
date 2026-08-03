import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export interface PriceRangeBarProps {
  min: number;
  max: number;
  median: number;
  currency?: string;
}

// A single row's own min–max span, not scaled against other rows — the bar
// always fills edge-to-edge, with a tick marking where the median sits
// within it. Replaces two plain Min/Max columns with one glanceable shape
// (bax anti-patterns: thin mark, rounded ends, no color-as-identity — the
// fill is neutral, the median tick is the only accent).
export function PriceRangeBar({ min, max, median, currency }: PriceRangeBarProps) {
  const span = max - min;
  const medianPercent = span > 0 ? ((median - min) / span) * 100 : 50;
  const suffix = currency ? ` ${currency}` : '';

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 180 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 44 }}>
        {min.toFixed(2)}
      </Typography>
      <Tooltip title={`Median: ${median.toFixed(2)}${suffix}`}>
        <Box sx={{ position: 'relative', flex: 1, height: 6 }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 3,
              bgcolor: 'action.selected',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              left: `calc(${medianPercent}% - 1px)`,
              width: 2,
              height: 10,
              borderRadius: 1,
              bgcolor: 'primary.main',
            }}
          />
        </Box>
      </Tooltip>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 44, textAlign: 'right' }}>
        {max.toFixed(2)}
      </Typography>
    </Stack>
  );
}
