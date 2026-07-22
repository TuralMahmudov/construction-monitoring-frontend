import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type {
  CategorySearchParams,
  CreateCategoryRequest,
  ResourceCategory,
  ResourceCategoryTreeNode,
  UpdateCategoryRequest,
} from '../types/resourceCategory.types';

const BASE_URL = '/api/resource-categories';

export function createCategory(payload: CreateCategoryRequest): Promise<ResourceCategory> {
  return apiPost<ResourceCategory>(BASE_URL, payload);
}

export function updateCategory(
  id: string,
  payload: UpdateCategoryRequest,
): Promise<ResourceCategory> {
  return apiPut<ResourceCategory>(`${BASE_URL}/${id}`, payload);
}

export function deleteCategory(id: string): Promise<void> {
  return apiDelete<void>(`${BASE_URL}/${id}`);
}

export function getCategoryById(id: string): Promise<ResourceCategory> {
  return apiGet<ResourceCategory>(`${BASE_URL}/${id}`);
}

// Confirmed live: each node's `children` array is populated (nested, full
// depth) — not a flat roots-only list as first assumed.
export function getCategoryTree(): Promise<ResourceCategoryTreeNode[]> {
  return apiGet<ResourceCategoryTreeNode[]>(`${BASE_URL}/tree`);
}

export function getCategoryChildren(parentId: string): Promise<ResourceCategory[]> {
  return apiGet<ResourceCategory[]>(`${BASE_URL}/${parentId}/children`);
}

// The search endpoint's status filter is a plain `active` boolean, not a
// three-state string — ALL simply omits the param so both are returned.
// Sorting is a single `sort=field,direction` query param (Spring's
// Pageable), not the separate sortBy/sortDirection pair used internally.
export function searchCategories(
  params: CategorySearchParams,
): Promise<PageResponse<ResourceCategory>> {
  const { status, sortBy, sortDirection, ...rest } = params;
  const queryParams: Record<string, unknown> = { ...rest };

  if (status === 'ACTIVE') {
    queryParams.active = true;
  } else if (status === 'INACTIVE') {
    queryParams.active = false;
  }

  if (sortBy) {
    queryParams.sort = `${sortBy},${sortDirection ?? 'asc'}`;
  }

  return apiGet<PageResponse<ResourceCategory>>(`${BASE_URL}/search`, queryParams);
}

export function moveCategory(id: string, newParentId: string | null): Promise<ResourceCategory> {
  return apiPatch<ResourceCategory>(`${BASE_URL}/${id}/move`, { newParentId });
}

export function enableCategory(id: string): Promise<ResourceCategory> {
  return apiPatch<ResourceCategory>(`${BASE_URL}/${id}/enable`);
}

export function disableCategory(id: string): Promise<ResourceCategory> {
  return apiPatch<ResourceCategory>(`${BASE_URL}/${id}/disable`);
}
