import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { deleteResource } from '../api/resourcesApi';
import { resourceKeys } from './queryKeys';

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      queryClient.removeQueries({ queryKey: resourceKeys.detail(id) });
      enqueueSnackbar('Resurs uğurla silindi.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },
  });
}
