import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { deleteCategory } from '../api/resourceCategoryApi';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { categoryKeys } from './queryKeys';

interface DeleteCategoryVariables {
  id: string;
  parentId: string | null;
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id }: DeleteCategoryVariables) => deleteCategory(id),
    onSuccess: (_data, { id, parentId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(parentId) });
      }
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...categoryKeys.all, 'search'] });
      enqueueSnackbar('Kateqoriya uğurla silindi.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },
  });
}
