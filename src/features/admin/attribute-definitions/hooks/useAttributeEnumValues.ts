import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  createAttributeEnumValue,
  deleteAttributeEnumValue,
  getAttributeEnumValues,
  updateAttributeEnumValue,
} from '../api/attributeDefinitionsApi';
import type { AttributeEnumValueFormValues } from '../types/attributeDefinition.types';

const keys = {
  list: (definitionId: string) => ['attribute-definitions', definitionId, 'enum-values'] as const,
};

export function useAttributeEnumValues(definitionId: string | null) {
  return useQuery({
    queryKey: keys.list(definitionId ?? ''),
    queryFn: () => getAttributeEnumValues(definitionId as string),
    enabled: Boolean(definitionId),
  });
}

export function useCreateAttributeEnumValue(definitionId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: AttributeEnumValueFormValues) => createAttributeEnumValue(definitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(definitionId) });
      enqueueSnackbar('Dəyər uğurla əlavə edildi.', { variant: 'success' });
    },
  });
}

export function useUpdateAttributeEnumValue(definitionId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AttributeEnumValueFormValues }) =>
      updateAttributeEnumValue(definitionId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(definitionId) });
      enqueueSnackbar('Dəyər uğurla yeniləndi.', { variant: 'success' });
    },
  });
}

export function useDeleteAttributeEnumValue(definitionId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => deleteAttributeEnumValue(definitionId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(definitionId) });
      enqueueSnackbar('Dəyər uğurla silindi.', { variant: 'success' });
    },
  });
}
