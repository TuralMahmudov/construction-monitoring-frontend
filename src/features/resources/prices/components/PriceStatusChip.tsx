import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Chip from '@mui/material/Chip';
import { PRICE_STATUS, PRICE_STATUS_LABELS, type PriceStatus } from '../types/resourcePrice.types';

const STATUS_COLORS: Record<Exclude<PriceStatus, 4>, 'warning' | 'success' | 'error'> = {
  [PRICE_STATUS.PENDING]: 'warning',
  [PRICE_STATUS.APPROVED]: 'success',
  [PRICE_STATUS.REJECTED]: 'error',
};

export function PriceStatusChip({ status }: { status: PriceStatus }) {
  if (status === PRICE_STATUS.FLAGGED) {
    return (
      <Chip
        size="small"
        icon={<WarningAmberRoundedIcon />}
        label={PRICE_STATUS_LABELS[4]}
        sx={{ bgcolor: 'warning.dark', color: 'warning.contrastText', '& .MuiChip-icon': { color: 'inherit' } }}
      />
    );
  }
  return <Chip size="small" label={PRICE_STATUS_LABELS[status]} color={STATUS_COLORS[status]} />;
}
