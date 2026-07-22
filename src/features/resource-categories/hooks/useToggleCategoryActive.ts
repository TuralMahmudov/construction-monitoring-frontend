import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { disableCategory, enableCategory } from '../api/resourceCategoryApi';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResourceCategory } from '../types/resourceCategory.types';
import { categoryKeys } from './queryKeys';
import { patchCategoryInArray } from './mutationHelpers';

interface ToggleActiveVariables {
  category: ResourceCategory;
  active: boolean;
}

interface ToggleActiveContext {
  previousTree?: ResourceCategory[];
  previousChildren?: ResourceCategory[];
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation<ResourceCategory, unknown, ToggleActiveVariables, ToggleActiveContext>({
    mutationFn: ({ category, active }) =>
      active ? enableCategory(category.id) : disableCategory(category.id),

    onMutate: async ({ category, active }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.tree() });
      const previousTree = queryClient.getQueryData<ResourceCategory[]>(categoryKeys.tree());
      const optimistic: ResourceCategory = { ...category, active };
      queryClient.setQueryData(categoryKeys.tree(), patchCategoryInArray(previousTree, optimistic));

      let previousChildren: ResourceCategory[] | undefined;
      if (category.parentId) {
        await queryClient.cancelQueries({ queryKey: categoryKeys.children(category.parentId) });
        previousChildren = queryClient.getQueryData<ResourceCategory[]>(
          categoryKeys.children(category.parentId),
        );
        queryClient.setQueryData(
          categoryKeys.children(category.parentId),
          patchCategoryInArray(previousChildren, optimistic),
        );
      }

      queryClient.setQueryData(categoryKeys.detail(category.id), optimistic);

      return { previousTree, previousChildren };
    },

    onError: (error, { category }, context) => {
      if (context?.previousTree !== undefined) {
        queryClient.setQueryData(categoryKeys.tree(), context.previousTree);
      }
      if (category.parentId && context?.previousChildren !== undefined) {
        queryClient.setQueryData(categoryKeys.children(category.parentId), context.previousChildren);
      }
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    },

    onSuccess: (_updated, { active }) => {
      enqueueSnackbar(
        active ? 'Kateqoriya aktivləşdirildi.' : 'Kateqoriya deaktiv edildi.',
        { variant: 'success' },
      );
    },

    onSettled: (_updated, _error, { category }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      if (category.parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.children(category.parentId) });
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(category.id) });
      queryClient.invalidateQueries({ queryKey: [...categoryKeys.all, 'search'] });
    },
  });
}
