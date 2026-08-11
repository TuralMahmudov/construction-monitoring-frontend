import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationsApi';
import type { NotificationSearchParams } from '../types/notification.types';

const POLL_INTERVAL_MS = 30_000;

const notificationKeys = {
  root: ['notifications'] as const,
  mine: (params: NotificationSearchParams) => [...notificationKeys.root, 'mine', params] as const,
};

export function useNotifications(params: NotificationSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.mine(params),
    queryFn: () => getMyNotifications(params),
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.root });
    },
  });
}
