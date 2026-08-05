import Chip from '@mui/material/Chip';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS, type OrganizationType } from '../../admin/organizations/types/organization.types';

export interface OrganizationChipProps {
  organizationName: string | null;
  organizationType: OrganizationType | null;
}

// organizationName/organizationType travel directly on the resource/price
// response (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 7.2, added
// 2026-08-04) — no more per-row ORGANIZATION_READ-gated id lookup needed.
export function OrganizationChip({ organizationName, organizationType }: OrganizationChipProps) {
  if (!organizationName) {
    return <Chip size="small" label="Ümumi/Mərkəzi" color="default" variant="outlined" />;
  }

  const label = organizationType
    ? `${organizationName} ${ORGANIZATION_TYPE_ICONS[organizationType]} ${ORGANIZATION_TYPE_LABELS[organizationType]}`
    : organizationName;

  return <Chip size="small" label={label} color="primary" variant="outlined" />;
}
