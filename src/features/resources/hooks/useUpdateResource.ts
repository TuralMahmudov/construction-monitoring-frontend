import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { updateResource } from '../api/resourcesApi';
import type { ResourceUpdateRequest } from '../types/resource.types';
import { resourceKeys } from './queryKeys';

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceUpdateRequest }) =>
      updateResource(id, payload),
    onSuccess: (_updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
      enqueueSnackbar('Resurs uğurla yeniləndi.', { variant: 'success' });
    },
  });
}
