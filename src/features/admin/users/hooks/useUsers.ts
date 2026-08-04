import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { createUser, searchUsers, updateUser } from '../api/usersApi';
import type { UserCreateFormValues, UserSearchParams, UserUpdateFormValues } from '../types/user.types';

const keys = {
  all: ['central-users'] as const,
  list: (params: UserSearchParams) => ['central-users', 'list', params] as const,
};

export function useUsersList(params: UserSearchParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => searchUsers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: UserCreateFormValues) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('İstifadəçi uğurla yaradıldı.', { variant: 'success' });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdateFormValues }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      enqueueSnackbar('İstifadəçi uğurla yeniləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}
