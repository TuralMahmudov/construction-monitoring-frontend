import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type { ReferenceDataSearchParams } from '../types/referenceData.types';

export interface ReferenceDataApi<TItem, TRequest> {
  list: (params: ReferenceDataSearchParams) => Promise<PageResponse<TItem>>;
  getById: (id: string) => Promise<TItem>;
  create: (payload: TRequest) => Promise<TItem>;
  update: (id: string, payload: TRequest) => Promise<TItem>;
  remove: (id: string) => Promise<void>;
}

export function createReferenceDataApi<TItem, TRequest>(
  basePath: string,
): ReferenceDataApi<TItem, TRequest> {
  return {
    list: (params) => apiGet<PageResponse<TItem>>(basePath, { ...params }),
    getById: (id) => apiGet<TItem>(`${basePath}/${id}`),
    create: (payload) => apiPost<TItem>(basePath, payload),
    update: (id, payload) => apiPut<TItem>(`${basePath}/${id}`, payload),
    remove: (id) => apiDelete<void>(`${basePath}/${id}`),
  };
}
