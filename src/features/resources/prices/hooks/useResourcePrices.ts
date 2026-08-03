import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import {
  approveResourcePrice,
  createResourcePrice,
  getPriceHistory,
  rejectResourcePrice,
  updateResourcePrice,
} from '../api/resourcePricesApi';
import { PRICE_STATUS, type ResourcePrice, type ResourcePriceFormValues } from '../types/resourcePrice.types';

const HISTORY_PAGE_SIZE = 100;

const priceKeys = {
  history: (resourceId: string) => ['resource-prices', 'history', resourceId] as const,
};

export function useResourcePriceHistory(resourceId: string) {
  return useQuery({
    queryKey: priceKeys.history(resourceId),
    queryFn: () => getPriceHistory(resourceId, HISTORY_PAGE_SIZE),
  });
}

export function useCreateResourcePrice(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: ResourcePriceFormValues) => createResourcePrice(resourceId, payload),
    onSuccess: (price: ResourcePrice) => {
      queryClient.invalidateQueries({ queryKey: priceKeys.history(resourceId) });
      enqueueSnackbar(
        price.status === PRICE_STATUS.FLAGGED
          ? 'Qiymət yaradıldı, lakin bazar qiymətindən əhəmiyyətli dərəcədə fərqləndiyi üçün admin nəzərdənkeçirməsinə göndərildi.'
          : 'Qiymət yaradıldı, təsdiq gözləyir.',
        { variant: price.status === PRICE_STATUS.FLAGGED ? 'warning' : 'success' },
      );
    },
  });
}

export function useUpdateResourcePrice(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourcePriceFormValues }) =>
      updateResourcePrice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceKeys.history(resourceId) });
      enqueueSnackbar('Qiymət uğurla yeniləndi.', { variant: 'success' });
    },
  });
}

export function useApproveResourcePrice(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => approveResourcePrice(id),
    onSuccess: () => {
      // Approving can also truncate another row's expireDate, so the whole
      // history (both the derived "current" view and the full table) needs
      // a refetch, not just an optimistic patch of the one approved row.
      queryClient.invalidateQueries({ queryKey: priceKeys.history(resourceId) });
      enqueueSnackbar('Qiymət təsdiqləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}

export function useRejectResourcePrice(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => rejectResourcePrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceKeys.history(resourceId) });
      enqueueSnackbar('Qiymət rədd edildi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
