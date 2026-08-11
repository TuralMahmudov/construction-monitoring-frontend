import { apiGet, apiPatch } from '../../../services/httpClient';
import type { NotificationSearchParams, NotificationsPageResponse } from '../types/notification.types';

const BASE_URL = '/api/notifications';

export function getMyNotifications(params: NotificationSearchParams): Promise<NotificationsPageResponse> {
  return apiGet<NotificationsPageResponse>(`${BASE_URL}/mine`, { ...params });
}

export function markNotificationRead(id: string): Promise<void> {
  return apiPatch<void>(`${BASE_URL}/${id}/read`);
}

export function markAllNotificationsRead(): Promise<void> {
  return apiPatch<void>(`${BASE_URL}/read-all`);
}
