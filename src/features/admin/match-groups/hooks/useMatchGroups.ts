import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { confirmMatchGroup, getPendingReviewMatchGroups } from '../api/matchGroupsApi';
import type { MatchGroupSearchParams } from '../types/matchGroup.types';

const matchGroupsRootKey = ['match-groups', 'pending-review'] as const;
const matchGroupsKey = (params: MatchGroupSearchParams) => [...matchGroupsRootKey, params] as const;

export function useMatchGroupsPendingReview(params: MatchGroupSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: matchGroupsKey(params),
    queryFn: () => getPendingReviewMatchGroups(params),
    enabled: options?.enabled ?? true,
  });
}

export function useConfirmMatchGroup() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => confirmMatchGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchGroupsRootKey });
      enqueueSnackbar('Qruplaşdırma təsdiqləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
