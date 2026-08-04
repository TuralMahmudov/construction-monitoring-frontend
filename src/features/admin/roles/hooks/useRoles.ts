import { useQuery } from '@tanstack/react-query';
import { getRoles } from '../api/rolesApi';

// Fixed system role list — shared lookup for the Organization/User
// role-multiselects (FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 1). Never
// hardcode role names in a form, always resolve them from here.
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 5 * 60_000,
  });
}
