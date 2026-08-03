import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { disableProduct, enableProduct } from '../api/productsApi';
import { productKeys } from './queryKeys';

// § 2.3 — enable/disable only hides a product from the catalog for new
// listings; existing resources referencing it are unaffected.
export function useProductActiveToggle() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? enableProduct(id) : disableProduct(id),
    onSuccess: (_data, { id, active }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      enqueueSnackbar(active ? 'Məhsul aktivləşdirildi.' : 'Məhsul deaktiv edildi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
