import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { createResource } from '../api/resourcesApi';
import { resourceKeys } from './queryKeys';

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      enqueueSnackbar('Resurs uğurla yaradıldı.', { variant: 'success' });
    },
  });
}
