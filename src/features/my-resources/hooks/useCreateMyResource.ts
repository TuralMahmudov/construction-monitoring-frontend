import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { createMyResource } from '../api/myResourcesApi';
import { myResourceKeys } from './queryKeys';

export function useCreateMyResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: createMyResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myResourceKeys.all });
      enqueueSnackbar('Resurs uğurla göndərildi.', { variant: 'success' });
    },
  });
}
