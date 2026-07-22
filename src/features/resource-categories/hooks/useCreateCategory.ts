import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { createCategory } from '../api/resourceCategoryApi';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { CreateCategoryRequest } from '../types/resourceCategory.types';
import { categoryKeys } from './queryKeys';

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      if (created.parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(created.parentId) });
      }
      queryClient.invalidateQueries({ queryKey: [...categoryKeys.all, 'search'] });
      enqueueSnackbar('Kateqoriya uğurla yaradıldı.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },
  });
}
