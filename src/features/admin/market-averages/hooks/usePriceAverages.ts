import { useQuery } from '@tanstack/react-query';
import { getPriceAverages } from '../api/priceAveragesApi';
import type { PriceAverageSearchParams } from '../types/priceAverage.types';

export function usePriceAverages(params: PriceAverageSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['price-averages', params] as const,
    queryFn: () => getPriceAverages(params),
    enabled: options?.enabled ?? true,
  });
}
