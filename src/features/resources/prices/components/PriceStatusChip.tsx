import Chip from '@mui/material/Chip';
import { PRICE_STATUS, PRICE_STATUS_LABELS, type PriceStatus } from '../types/resourcePrice.types';

const STATUS_COLORS: Record<PriceStatus, 'warning' | 'success' | 'error'> = {
  [PRICE_STATUS.PENDING]: 'warning',
  [PRICE_STATUS.APPROVED]: 'success',
  [PRICE_STATUS.REJECTED]: 'error',
};

export function PriceStatusChip({ status }: { status: PriceStatus }) {
  return (
    <Chip size="small" label={PRICE_STATUS_LABELS[status]} color={STATUS_COLORS[status]} />
  );
}
