import { apiGet, apiPatch, apiPost, apiPut } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { ResourcePrice, ResourcePriceFormValues } from '../types/resourcePrice.types';

const BASE_URL = '/api/resource-prices';

export function getPriceHistory(resourceId: string, size = 100): Promise<PageResponse<ResourcePrice>> {
  return apiGet<PageResponse<ResourcePrice>>(`${BASE_URL}/history`, { resourceId, size });
}

// `organizationId` is only needed for a central caller (see
// ResourcePriceFormValues comment) — omit it for an organization caller
// submitting their own resource's price.
export function createResourcePrice(
  resourceId: string,
  payload: ResourcePriceFormValues,
  organizationId?: string | null,
): Promise<ResourcePrice> {
  return apiPost<ResourcePrice>(BASE_URL, {
    ...payload,
    resourceId,
    ...(organizationId ? { organizationId } : {}),
  });
}

export function updateResourcePrice(
  id: string,
  payload: ResourcePriceFormValues,
): Promise<ResourcePrice> {
  return apiPut<ResourcePrice>(`${BASE_URL}/${id}`, payload);
}

export function approveResourcePrice(id: string): Promise<ResourcePrice> {
  return apiPatch<ResourcePrice>(`${BASE_URL}/${id}/approve`);
}

export function rejectResourcePrice(id: string): Promise<ResourcePrice> {
  return apiPatch<ResourcePrice>(`${BASE_URL}/${id}/reject`);
}
