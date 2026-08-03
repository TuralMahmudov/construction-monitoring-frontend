import Chip from '@mui/material/Chip';
import { RESOURCE_STATUS, type ResourceStatus } from '../types/myResource.types';

const MUI_COLOR_STATUSES: Record<Exclude<ResourceStatus, 3>, 'warning' | 'primary' | 'success' | 'error'> = {
  [RESOURCE_STATUS.DRAFT]: 'warning',
  [RESOURCE_STATUS.SUBMITTED]: 'primary',
  [RESOURCE_STATUS.APPROVED]: 'success',
  [RESOURCE_STATUS.REJECTED]: 'error',
};

export interface StatusChipProps {
  status: ResourceStatus;
  label: string;
}

// Frontend never derives `status` — it only maps whatever value/label the
// backend returns to a color. CLARIFICATION_NEEDED gets a bespoke orange
// since MUI's Chip `color` prop has no built-in "orange" (bax
// PriceStatusChip, which uses the same sx-override approach for its own
// non-standard status color).
export function StatusChip({ status, label }: StatusChipProps) {
  if (status === RESOURCE_STATUS.CLARIFICATION_NEEDED) {
    return (
      <Chip
        size="small"
        label={label}
        sx={{ bgcolor: 'orange', color: 'common.white' }}
      />
    );
  }
  return <Chip size="small" label={label} color={MUI_COLOR_STATUSES[status]} />;
}
