import Chip from '@mui/material/Chip';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS, type OrganizationType } from '../types/organization.types';

export function OrganizationTypeChip({ type }: { type: OrganizationType }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`${ORGANIZATION_TYPE_ICONS[type]} ${ORGANIZATION_TYPE_LABELS[type]}`}
    />
  );
}
