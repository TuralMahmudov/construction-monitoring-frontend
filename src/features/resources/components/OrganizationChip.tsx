import Chip from '@mui/material/Chip';
import { useAuth } from '../../../hooks/useAuth';
import { isCentralAdmin } from '../../../shared/lib/permissions';
import { useOrganizationLookup } from '../../admin/organizations/hooks/useOrganizations';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS } from '../../admin/organizations/types/organization.types';

export interface OrganizationChipProps {
  organizationId: string | null;
}

// Name/type resolution only fires for central-admin users — GET
// /api/organizations requires ORGANIZATION_READ, which non-admin roles
// don't have (bax useOrganizationLookup). Other roles keep the generic
// label, same as before this lookup existed.
export function OrganizationChip({ organizationId }: OrganizationChipProps) {
  const { user } = useAuth();
  const organizations = useOrganizationLookup(isCentralAdmin(user?.roles ?? []));

  if (!organizationId) {
    return <Chip size="small" label="Ümumi/Mərkəzi" color="default" variant="outlined" />;
  }

  const org = organizations.get(organizationId);
  const label = org
    ? `${org.name} ${ORGANIZATION_TYPE_ICONS[org.type]} ${ORGANIZATION_TYPE_LABELS[org.type]}`
    : 'Təşkilata məxsus';

  return <Chip size="small" label={label} color="primary" variant="outlined" />;
}
