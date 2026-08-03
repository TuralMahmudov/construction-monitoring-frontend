import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Chip from '@mui/material/Chip';
import type { Variability } from '../utils/priceVariability';

const ICONS = {
  stable: CheckCircleRoundedIcon,
  moderate: WarningAmberRoundedIcon,
  high: ErrorRoundedIcon,
} as const;

const COLORS = {
  stable: 'success',
  moderate: 'warning',
  high: 'error',
} as const;

// Status is never color-alone here — icon + label always ship together.
export function VariabilityChip({ variability }: { variability: Variability }) {
  const Icon = ICONS[variability.level];
  return (
    <Chip
      size="small"
      icon={<Icon />}
      label={`${variability.label} (${variability.percent.toFixed(0)}%)`}
      color={COLORS[variability.level]}
      variant="outlined"
    />
  );
}
