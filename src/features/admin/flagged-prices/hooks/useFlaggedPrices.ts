import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { approveResourcePrice, rejectResourcePrice } from '../../../resources/prices/api/resourcePricesApi';
import { getFlaggedPrices } from '../api/flaggedPricesApi';
import type { FlaggedPriceSearchParams } from '../types/flaggedPrice.types';

const flaggedPricesRootKey = ['flagged-prices'] as const;
const flaggedPricesKey = (params: FlaggedPriceSearchParams) => [...flaggedPricesRootKey, params] as const;

export function useFlaggedPrices(params: FlaggedPriceSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: flaggedPricesKey(params),
    queryFn: () => getFlaggedPrices(params),
    enabled: options?.enabled ?? true,
  });
}

export function useApproveFlaggedPrice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => approveResourcePrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flaggedPricesRootKey });
      enqueueSnackbar('Qiymət təsdiqləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}

export function useRejectFlaggedPrice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => rejectResourcePrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flaggedPricesRootKey });
      enqueueSnackbar('Qiymət rədd edildi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
