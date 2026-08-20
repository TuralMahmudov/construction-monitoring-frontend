import { apiGet } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type {
  PriceAverageSearchParams,
  ResourcePriceAverageResponse,
  ResourcePriceAverageSummaryResponse,
} from '../types/priceAverage.types';

const BASE_URL = '/api/resource-prices/averages';

export function getPriceAverages(
  params: PriceAverageSearchParams,
): Promise<PageResponse<ResourcePriceAverageResponse>> {
  return apiGet<PageResponse<ResourcePriceAverageResponse>>(BASE_URL, { ...params });
}

// GET /api/resource-prices/averages/stats — same filters minus
// variabilityLevel/page/size, full-result variability breakdown (drives the
// admin panel's KPI cards independently of pagination).
export function getPriceAveragesSummary(
  params: Omit<PriceAverageSearchParams, 'variabilityLevel' | 'page' | 'size' | 'sort'>,
): Promise<ResourcePriceAverageSummaryResponse> {
  return apiGet<ResourcePriceAverageSummaryResponse>(`${BASE_URL}/stats`, { ...params });
}
