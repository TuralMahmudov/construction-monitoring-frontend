import { apiGet, apiPost } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type {
  CreateMyResourceRequest,
  MyResource,
  MyResourceDetail,
  MyResourceSearchParams,
} from '../types/myResource.types';

// All requests are implicitly scoped server-side to the current user's
// organization (mirrors how /api/auth/me is implicit-user-scoped) — there is
// no organizationId param, spoofing another org's "mine" isn't possible.
const BASE_URL = '/api/resources/mine';

export function searchMyResources(params: MyResourceSearchParams): Promise<PageResponse<MyResource>> {
  return apiGet<PageResponse<MyResource>>(BASE_URL, { ...params });
}

export function getMyResourceById(id: string): Promise<MyResourceDetail> {
  return apiGet<MyResourceDetail>(`${BASE_URL}/${id}`);
}

export function createMyResource(payload: CreateMyResourceRequest): Promise<MyResourceDetail> {
  return apiPost<MyResourceDetail>(BASE_URL, payload);
}
