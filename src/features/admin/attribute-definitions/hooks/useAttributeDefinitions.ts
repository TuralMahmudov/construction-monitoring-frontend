import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ApiError } from '../../../../services/httpClient';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import {
  createAttributeDefinition,
  deleteAttributeDefinition,
  searchAttributeDefinitions,
  updateAttributeDefinition,
} from '../api/attributeDefinitionsApi';
import type {
  AttributeDefinitionFormValues,
  AttributeDefinitionSearchParams,
} from '../types/attributeDefinition.types';

const keys = {
  all: ['attribute-definitions'] as const,
  list: (params: AttributeDefinitionSearchParams) => ['attribute-definitions', 'list', params] as const,
};

export function useAttributeDefinitionsList(params: AttributeDefinitionSearchParams, enabled = true) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => searchAttributeDefinitions(params),
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

// Unpaginated, active-only — for pickers (e.g. "link an attribute to this
// category") that need the full set rather than a grid page.
export function useAllActiveAttributeDefinitions() {
  return useQuery({
    queryKey: ['attribute-definitions', 'all-active'],
    queryFn: () => searchAttributeDefinitions({ active: true, size: 200 }),
    staleTime: 60_000,
  });
}

export function useCreateAttributeDefinition() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: AttributeDefinitionFormValues) => createAttributeDefinition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('Atribut uğurla yaradıldı.', { variant: 'success' });
    },
  });
}

export function useUpdateAttributeDefinition() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AttributeDefinitionFormValues }) =>
      updateAttributeDefinition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('Atribut uğurla yeniləndi.', { variant: 'success' });
    },
  });
}

export function useDeleteAttributeDefinition() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => deleteAttributeDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('Atribut uğurla silindi.', { variant: 'success' });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        enqueueSnackbar('Bu atribut kateqoriyalarda istifadə olunur, silinə bilməz.', { variant: 'warning' });
      } else {
        enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
      }
    },
  });
}
