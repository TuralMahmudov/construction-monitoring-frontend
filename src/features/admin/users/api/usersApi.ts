import { apiGet, apiPost, apiPut } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type { CentralUser, UserCreatePayload, UserSearchParams, UserUpdateFormValues } from '../types/user.types';

const BASE_URL = '/api/users';

export function searchUsers(params: UserSearchParams): Promise<PageResponse<CentralUser>> {
  return apiGet<PageResponse<CentralUser>>(BASE_URL, { ...params });
}

export function createUser(payload: UserCreatePayload): Promise<CentralUser> {
  return apiPost<CentralUser>(BASE_URL, payload);
}

// No hard-delete — `enabled=false` is how a central account is disabled.
export function updateUser(id: string, payload: UserUpdateFormValues): Promise<CentralUser> {
  return apiPut<CentralUser>(`${BASE_URL}/${id}`, payload);
}
