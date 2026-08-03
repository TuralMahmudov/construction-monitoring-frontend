import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { createMyResourcePrice, listMyResourcePrices } from '../api/myResourcePricesApi';
import { myResourceKeys } from './queryKeys';

export function useMyResourcePriceList(resourceId: string | null) {
  return useQuery({
    queryKey: myResourceKeys.prices(resourceId ?? ''),
    queryFn: () => listMyResourcePrices(resourceId as string),
    enabled: resourceId !== null,
  });
}

export function useCreateMyResourcePrice(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createMyResourcePrice>[1]) =>
      createMyResourcePrice(resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myResourceKeys.prices(resourceId) });
      queryClient.invalidateQueries({ queryKey: myResourceKeys.all });
      enqueueSnackbar('Qiymət əlavə edildi.', { variant: 'success' });
    },
  });
}
