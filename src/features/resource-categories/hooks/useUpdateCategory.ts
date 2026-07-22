import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { updateCategory } from '../api/resourceCategoryApi';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResourceCategory, UpdateCategoryRequest } from '../types/resourceCategory.types';
import { categoryKeys } from './queryKeys';
import { patchCategoryInArray } from './mutationHelpers';

interface UpdateCategoryVariables {
  id: string;
  parentId: string | null;
  payload: UpdateCategoryRequest;
}

interface UpdateCategoryContext {
  previousTree?: ResourceCategory[];
  previousChildren?: ResourceCategory[];
  previousDetail?: ResourceCategory;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation<ResourceCategory, unknown, UpdateCategoryVariables, UpdateCategoryContext>({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),

    onMutate: async ({ id, parentId, payload }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.tree() });
      if (parentId) {
        await queryClient.cancelQueries({ queryKey: categoryKeys.children(parentId) });
      }
      await queryClient.cancelQueries({ queryKey: categoryKeys.detail(id) });

      const previousTree = queryClient.getQueryData<ResourceCategory[]>(categoryKeys.tree());
      const previousChildren = parentId
        ? queryClient.getQueryData<ResourceCategory[]>(categoryKeys.children(parentId))
        : undefined;
      const previousDetail = queryClient.getQueryData<ResourceCategory>(categoryKeys.detail(id));

      const base =
        previousDetail ??
        previousTree?.find((category) => category.id === id) ??
        previousChildren?.find((category) => category.id === id);

      if (base) {
        const optimistic: ResourceCategory = { ...base, ...payload };
        queryClient.setQueryData(categoryKeys.tree(), patchCategoryInArray(previousTree, optimistic));
        if (parentId) {
          queryClient.setQueryData(
            categoryKeys.children(parentId),
            patchCategoryInArray(previousChildren, optimistic),
          );
        }
        queryClient.setQueryData(categoryKeys.detail(id), optimistic);
      }

      return { previousTree, previousChildren, previousDetail };
    },

    onError: (error, { id, parentId }, context) => {
      if (context?.previousTree !== undefined) {
        queryClient.setQueryData(categoryKeys.tree(), context.previousTree);
      }
      if (parentId && context?.previousChildren !== undefined) {
        queryClient.setQueryData(categoryKeys.children(parentId), context.previousChildren);
      }
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(categoryKeys.detail(id), context.previousDetail);
      }
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },

    onSuccess: () => {
      enqueueSnackbar('Kateqoriya uğurla yeniləndi.', { variant: 'success' });
    },

    onSettled: (_updated, _error, { id, parentId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(parentId) });
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...categoryKeys.all, 'search'] });
    },
  });
}
