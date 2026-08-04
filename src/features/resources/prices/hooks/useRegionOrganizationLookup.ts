import { useMemo } from 'react';
import { useAllRegions } from '../../../reference-data/hooks/useReferenceOptions';
import { useAllOrganizations } from '../../../admin/organizations/hooks/useOrganizations';
import { ORGANIZATION_TYPE_ICONS, ORGANIZATION_TYPE_LABELS } from '../../../admin/organizations/types/organization.types';

// `canSeeOrgNames` must be `isCentralAdmin(user?.roles ?? [])` from any
// screen non-admin roles can reach — GET /api/organizations requires
// ORGANIZATION_READ, which only SUPER_ADMIN/ADMIN have (bax
// useOrganizationLookup). Passing true unconditionally would 403 for
// vendor/operator/analyst users.
export function useRegionOrganizationLookup(canSeeOrgNames: boolean) {
  const regionsQuery = useAllRegions();
  const organizationsQuery = useAllOrganizations(canSeeOrgNames);

  const regionNames = useMemo(() => {
    const map = new Map<string, string>();
    (regionsQuery.data?.content ?? []).forEach((region) => map.set(region.id, region.name));
    return map;
  }, [regionsQuery.data]);

  const organizationNames = useMemo(() => {
    const map = new Map<string, string>();
    (organizationsQuery.data?.content ?? []).forEach((org) =>
      map.set(org.id, `${org.name} ${ORGANIZATION_TYPE_ICONS[org.type]} ${ORGANIZATION_TYPE_LABELS[org.type]}`),
    );
    return map;
  }, [organizationsQuery.data]);

  return {
    regionNames,
    organizationNames,
    isLoading: regionsQuery.isLoading || (canSeeOrgNames && organizationsQuery.isLoading),
  };
}
