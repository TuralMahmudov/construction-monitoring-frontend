import { apiGet } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { FlaggedPriceReviewResponse, FlaggedPriceSearchParams } from '../types/flaggedPrice.types';

const BASE_URL = '/api/resource-prices/flagged';

export function getFlaggedPrices(
  params: FlaggedPriceSearchParams,
): Promise<PageResponse<FlaggedPriceReviewResponse>> {
  return apiGet<PageResponse<FlaggedPriceReviewResponse>>(BASE_URL, { ...params });
}
