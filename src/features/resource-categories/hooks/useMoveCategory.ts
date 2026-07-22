import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { moveCategory } from '../api/resourceCategoryApi';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { categoryKeys } from './queryKeys';

interface MoveCategoryVariables {
  category: ResourceCategory;
  newParentId: string | null;
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ category, newParentId }: MoveCategoryVariables) =>
      moveCategory(category.id, newParentId),
    onSuccess: (_updated, { category, newParentId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      if (category.parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(category.parentId) });
      }
      if (newParentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(newParentId) });
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(category.id) });
      queryClient.invalidateQueries({ queryKey: [...categoryKeys.all, 'search'] });
      enqueueSnackbar('Kateqoriya uğurla köçürüldü.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },
  });
}
