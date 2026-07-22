import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type { Resource, ResourceFormValues, ResourceSearchParams } from '../types/resource.types';

const BASE_URL = '/api/resources';

export function searchResources(params: ResourceSearchParams): Promise<PageResponse<Resource>> {
  return apiGet<PageResponse<Resource>>(BASE_URL, { ...params });
}

export function getResourceById(id: string): Promise<Resource> {
  return apiGet<Resource>(`${BASE_URL}/${id}`);
}

export function createResource(payload: ResourceFormValues): Promise<Resource> {
  return apiPost<Resource>(BASE_URL, payload);
}

export function updateResource(id: string, payload: ResourceFormValues): Promise<Resource> {
  return apiPut<Resource>(`${BASE_URL}/${id}`, payload);
}

export function deleteResource(id: string): Promise<void> {
  return apiDelete<void>(`${BASE_URL}/${id}`);
}
