import Chip from '@mui/material/Chip';
import {
  ORGANIZATION_STATUS,
  ORGANIZATION_STATUS_LABELS,
  type OrganizationStatus,
} from '../types/organization.types';

const STATUS_COLORS: Record<OrganizationStatus, 'success' | 'default' | 'error'> = {
  [ORGANIZATION_STATUS.ACTIVE]: 'success',
  [ORGANIZATION_STATUS.INACTIVE]: 'default',
  [ORGANIZATION_STATUS.SUSPENDED]: 'error',
};

export function OrganizationStatusChip({ status }: { status: OrganizationStatus }) {
  return <Chip size="small" label={ORGANIZATION_STATUS_LABELS[status]} color={STATUS_COLORS[status]} />;
}
