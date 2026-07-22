import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ReferenceDataApi } from '../api/createReferenceDataApi';
import type { ReferenceDataSearchParams } from '../types/referenceData.types';

export interface ReferenceDataHookLabels {
  created: string;
  updated: string;
  deleted: string;
  /** Shown when delete fails with 409 (the record is referenced elsewhere) —
   *  this is an expected outcome, not an error, so it gets its own message. */
  deleteConflict: string;
}

/**
 * Builds the full set of React Query hooks for a simple code/name/active
 * reference entity (Units, Regions, Suppliers all share this shape) so the
 * query/mutation/cache-invalidation boilerplate is written once instead of
 * three times.
 */
export function createReferenceDataHooks<TItem, TRequest>(
  entityKey: string,
  api: ReferenceDataApi<TItem, TRequest>,
  labels: ReferenceDataHookLabels,
) {
  const keys = {
    all: [entityKey] as const,
    list: (params: ReferenceDataSearchParams) => [entityKey, 'list', params] as const,
    detail: (id: string) => [entityKey, 'detail', id] as const,
  };

  function useList(params: ReferenceDataSearchParams) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      placeholderData: (previousData) => previousData,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    return useMutation({
      mutationFn: (payload: TRequest) => api.create(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        enqueueSnackbar(labels.created, { variant: 'success' });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: TRequest }) => api.update(id, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        enqueueSnackbar(labels.updated, { variant: 'success' });
      },
    });
  }

  function useRemove() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        enqueueSnackbar(labels.deleted, { variant: 'success' });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          enqueueSnackbar(labels.deleteConflict, { variant: 'warning' });
        } else {
          enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
        }
      },
    });
  }

  return { keys, useList, useCreate, useUpdate, useRemove };
}

export type ReferenceDataHooks<TItem, TRequest> = ReturnType<
  typeof createReferenceDataHooks<TItem, TRequest>
>;
