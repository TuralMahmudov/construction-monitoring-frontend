import { ApiError } from '../../services/httpClient';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Daxil edilən məlumatlarda xəta var.',
  401: 'Sessiyanızın müddəti bitib. Yenidən daxil olun.',
  403: 'Bu əməliyyat üçün icazəniz yoxdur.',
  404: 'Axtarılan məlumat tapılmadı.',
  409: 'Bu əməliyyat mövcud məlumatla konflikt yaradır.',
  500: 'Serverdə xəta baş verdi. Yenidən cəhd edin.',
};

const DEFAULT_MESSAGE = 'Naməlum xəta baş verdi. Yenidən cəhd edin.';
const NETWORK_MESSAGE = 'Serverlə əlaqə qurula bilmədi. İnternet bağlantınızı yoxlayın.';

/**
 * Maps any error thrown by the API layer to a user-facing Azerbaijani
 * message. Backend messages are not shown directly since they may not be
 * localized; only the HTTP status is trusted to pick a message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return NETWORK_MESSAGE;
    }
    return STATUS_MESSAGES[error.status] ?? DEFAULT_MESSAGE;
  }
  return DEFAULT_MESSAGE;
}
