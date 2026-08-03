import { apiGet, apiPatch } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { MatchGroupReviewResponse, MatchGroupSearchParams } from '../types/matchGroup.types';

// § 7 — endpoints moved from /api/resource-match-groups to /api/products,
// the "match group" concept now lives inside a pending-review product
// (matchKey empty/reviewStatus=2, bax product.types.ts).
const BASE_URL = '/api/products';

export function getPendingReviewMatchGroups(
  params: MatchGroupSearchParams,
): Promise<PageResponse<MatchGroupReviewResponse>> {
  return apiGet<PageResponse<MatchGroupReviewResponse>>(`${BASE_URL}/pending-review`, { ...params });
}

export function confirmMatchGroup(id: string): Promise<MatchGroupReviewResponse> {
  return apiPatch<MatchGroupReviewResponse>(`${BASE_URL}/${id}/confirm`);
}
