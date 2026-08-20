import { apiGet } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { PeriodAverageSearchParams, ResourcePricePeriodAverageResponse } from '../types/periodAverage.types';

const BASE_URL = '/api/resource-prices/period-averages';

export function getPeriodAverages(
  params: PeriodAverageSearchParams,
): Promise<PageResponse<ResourcePricePeriodAverageResponse>> {
  return apiGet<PageResponse<ResourcePricePeriodAverageResponse>>(BASE_URL, { ...params });
}
