import type { PageResponse } from '../../../shared/types/pagination.types';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  referenceType: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

// § 6.1 — unreadCount rides inside the same paged response, no separate
// lightweight endpoint (that was left open in the draft, closed this way).
export interface NotificationsPageResponse extends PageResponse<AppNotification> {
  unreadCount: number;
}

export interface NotificationSearchParams {
  page?: number;
  size?: number;
}
