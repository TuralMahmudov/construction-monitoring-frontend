import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type {
  Resource,
  ResourceCreateRequest,
  ResourceSearchParams,
  ResourceUpdateRequest,
} from '../types/resource.types';

const BASE_URL = '/api/resources';

// Autocomplete results are capped server-side at 20 distinct values. Moved
// back here from /api/products/... on 2026-07-31 — manufacturer/brand/model
// live on the resource (listing), not the product (bax
// FRONTEND_AI_PROMPT_PRODUCTS.md § 2.5).
const AUTOCOMPLETE_PARAM = 'search';

export function searchManufacturers(search: string): Promise<string[]> {
  return apiGet<string[]>(`${BASE_URL}/manufacturers`, { [AUTOCOMPLETE_PARAM]: search || undefined });
}

export function searchBrands(search: string): Promise<string[]> {
  return apiGet<string[]>(`${BASE_URL}/brands`, { [AUTOCOMPLETE_PARAM]: search || undefined });
}

export function searchModels(search: string): Promise<string[]> {
  return apiGet<string[]>(`${BASE_URL}/models`, { [AUTOCOMPLETE_PARAM]: search || undefined });
}

export function searchResources(params: ResourceSearchParams): Promise<PageResponse<Resource>> {
  return apiGet<PageResponse<Resource>>(BASE_URL, { ...params });
}

export function getResourceById(id: string): Promise<Resource> {
  return apiGet<Resource>(`${BASE_URL}/${id}`);
}

export function createResource(payload: ResourceCreateRequest): Promise<Resource> {
  return apiPost<Resource>(BASE_URL, payload);
}

export function updateResource(id: string, payload: ResourceUpdateRequest): Promise<Resource> {
  return apiPut<Resource>(`${BASE_URL}/${id}`, payload);
}

export function deleteResource(id: string): Promise<void> {
  return apiDelete<void>(`${BASE_URL}/${id}`);
}
