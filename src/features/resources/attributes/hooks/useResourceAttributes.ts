import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import {
  createResourceAttribute,
  deleteResourceAttribute,
  getResourceAttributes,
  updateResourceAttribute,
} from '../api/resourceAttributesApi';
import type { ResourceAttributeFormValues } from '../types/resourceAttribute.types';

const attributeKeys = {
  list: (resourceId: string) => ['resource-attributes', resourceId] as const,
};

export function useResourceAttributes(resourceId: string) {
  return useQuery({
    queryKey: attributeKeys.list(resourceId),
    queryFn: () => getResourceAttributes(resourceId),
  });
}

export function useCreateResourceAttribute(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: ResourceAttributeFormValues) => createResourceAttribute(resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.list(resourceId) });
      enqueueSnackbar('Xüsusiyyət uğurla əlavə edildi.', { variant: 'success' });
    },
  });
}

export function useUpdateResourceAttribute(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceAttributeFormValues }) =>
      updateResourceAttribute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.list(resourceId) });
      enqueueSnackbar('Xüsusiyyət uğurla yeniləndi.', { variant: 'success' });
    },
  });
}

export function useDeleteResourceAttribute(resourceId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => deleteResourceAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.list(resourceId) });
      enqueueSnackbar('Xüsusiyyət uğurla silindi.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },
  });
}
