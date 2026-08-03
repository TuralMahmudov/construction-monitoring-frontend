import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { updateProduct } from '../api/productsApi';
import type { ProductUpdateRequest } from '../types/product.types';
import { productKeys } from './queryKeys';

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductUpdateRequest }) => updateProduct(id, payload),
    onSuccess: (_updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      enqueueSnackbar('Məhsul uğurla yeniləndi.', { variant: 'success' });
    },
  });
}
