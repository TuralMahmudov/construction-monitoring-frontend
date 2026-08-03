import { useMutation, useQueryClient } from '@tanstack/react-query';
import { findOrCreateProduct } from '../api/productsApi';
import { productKeys } from './queryKeys';

// No snackbar here on success — the caller (resource-creation flow, § 2/§ 6)
// needs to branch on `matched` first to show either a "matched existing
// product" warning or a "new product created" confirmation.
export function useFindOrCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: findOrCreateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
