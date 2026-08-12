import { apiGet, apiPost, apiPut } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type {
  Organization,
  OrganizationCreatePayload,
  OrganizationSearchParams,
  OrganizationUpdateFormValues,
} from '../types/organization.types';

const BASE_URL = '/api/organizations';

export function searchOrganizations(params: OrganizationSearchParams): Promise<PageResponse<Organization>> {
  return apiGet<PageResponse<Organization>>(BASE_URL, { ...params });
}

export function createOrganization(payload: OrganizationCreatePayload): Promise<Organization> {
  return apiPost<Organization>(BASE_URL, payload);
}

// No hard-delete — organizations are referenced by users/resources/suppliers
// (FK RESTRICT), so PUT with a new `status` is the only way to disable one.
export function updateOrganization(id: string, payload: OrganizationUpdateFormValues): Promise<Organization> {
  return apiPut<Organization>(`${BASE_URL}/${id}`, payload);
}
