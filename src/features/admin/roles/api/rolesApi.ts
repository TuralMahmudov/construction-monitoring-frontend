import { apiGet } from '../../../../services/httpClient';
import type { RoleOption } from '../types/role.types';

// Unpaginated, fixed 6-row list (FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 1).
export function getRoles(): Promise<RoleOption[]> {
  return apiGet<RoleOption[]>('/api/roles');
}
