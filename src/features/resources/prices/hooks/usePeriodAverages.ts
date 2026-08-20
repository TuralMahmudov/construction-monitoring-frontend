import { useQuery } from '@tanstack/react-query';
import { getPeriodAverages } from '../api/periodAveragesApi';
import type { PeriodAverageSearchParams } from '../types/periodAverage.types';

export function usePeriodAverages(params: PeriodAverageSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['period-averages', params] as const,
    queryFn: () => getPeriodAverages(params),
    enabled: options?.enabled ?? true,
  });
}
