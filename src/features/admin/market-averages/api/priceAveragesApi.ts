import { apiGet } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { PriceAverageSearchParams, ResourcePriceAverageResponse } from '../types/priceAverage.types';

const BASE_URL = '/api/resource-prices/averages';

export function getPriceAverages(
  params: PriceAverageSearchParams,
): Promise<PageResponse<ResourcePriceAverageResponse>> {
  return apiGet<PageResponse<ResourcePriceAverageResponse>>(BASE_URL, { ...params });
}
