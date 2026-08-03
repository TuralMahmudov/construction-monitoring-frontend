import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import {
  getCategoryAttributes,
  linkAttributeToCategory,
  unlinkCategoryAttributeDefinition,
  updateCategoryAttributeDefinition,
} from '../api/categoryAttributeApi';
import type {
  LinkAttributeToCategoryFormValues,
  UpdateCategoryAttributeDefinitionFormValues,
} from '../types/categoryAttributeDefinition.types';

const keys = {
  list: (categoryId: string) => ['resource-categories', categoryId, 'attributes'] as const,
};

export function useCategoryAttributes(categoryId: string | null) {
  return useQuery({
    queryKey: keys.list(categoryId ?? ''),
    queryFn: () => getCategoryAttributes(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

export function useLinkAttributeToCategory(categoryId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: LinkAttributeToCategoryFormValues) => linkAttributeToCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      enqueueSnackbar('Atribut kateqoriyaya bağlandı.', { variant: 'success' });
    },
  });
}

export function useUpdateCategoryAttributeDefinition(categoryId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryAttributeDefinitionFormValues }) =>
      updateCategoryAttributeDefinition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      enqueueSnackbar('Konfiqurasiya yeniləndi.', { variant: 'success' });
    },
  });
}

export function useUnlinkCategoryAttributeDefinition(categoryId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => unlinkCategoryAttributeDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(categoryId) });
      enqueueSnackbar('Atribut kateqoriyadan ayrıldı.', { variant: 'success' });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        enqueueSnackbar('Bu atribut resurslarda istifadə olunur, ayrıla bilməz.', { variant: 'warning' });
      } else {
        enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
      }
    },
  });
}
