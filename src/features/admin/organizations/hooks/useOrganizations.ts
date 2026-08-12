import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { createOrganization, searchOrganizations, updateOrganization } from '../api/organizationsApi';
import type {
  Organization,
  OrganizationCreatePayload,
  OrganizationSearchParams,
  OrganizationUpdateFormValues,
} from '../types/organization.types';

const LOOKUP_PAGE_SIZE = 500;

const keys = {
  all: ['organizations'] as const,
  list: (params: OrganizationSearchParams) => ['organizations', 'list', params] as const,
};

export function useOrganizationsList(params: OrganizationSearchParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => searchOrganizations(params),
    placeholderData: (previousData) => previousData,
  });
}

// Unfiltered, all-orgs fetch for id -> name/type lookups (resource/price
// screens showing "whose listing/price is this" — bax OrganizationChip,
// useOrganizationLookup below). Orgs are a small, slow-changing list, so one
// page covers it and a 5min staleTime is fine.
//
// `enabled` defaults to true for admin-only screens (OrganizationsPage) but
// MUST be passed as `isCentralAdmin(...)` from any screen a non-admin role
// can reach (resource detail, price tables) — GET /api/organizations
// requires ORGANIZATION_READ, which is only granted to SUPER_ADMIN/ADMIN
// (FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § "Gating"). Calling it unconditionally
// would 403 for vendor/operator/analyst users.
export function useAllOrganizations(enabled = true) {
  return useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: () => searchOrganizations({ size: LOOKUP_PAGE_SIZE }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useOrganizationLookup(enabled = true) {
  const query = useAllOrganizations(enabled);
  return useMemo(() => {
    const map = new Map<string, Organization>();
    (query.data?.content ?? []).forEach((org) => map.set(org.id, org));
    return map;
  }, [query.data]);
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: OrganizationCreatePayload) => createOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('Təşkilat uğurla yaradıldı.', { variant: 'success' });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OrganizationUpdateFormValues }) =>
      updateOrganization(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('Təşkilat uğurla yeniləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
