import { useQuery } from '@tanstack/react-query';
import { getPriceAveragesSummary } from '../api/priceAveragesApi';
import type { PriceAverageSearchParams } from '../types/priceAverage.types';

export function useAveragesSummary(
  params: Omit<PriceAverageSearchParams, 'variabilityLevel' | 'page' | 'size' | 'sort'>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['price-averages-summary', params] as const,
    queryFn: () => getPriceAveragesSummary(params),
    enabled: options?.enabled ?? true,
  });
}
