import type { Role } from '../../types/auth';

// Only VIEWER lacks COST_WRITE — every other role can create/update/delete.
const WRITE_EXCLUDED_ROLES: Role[] = ['VIEWER'];

// COST_APPROVE is narrower than COST_WRITE: only these three may approve or
// reject a pending resource price.
const APPROVE_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'EXPERT'];

export function canWrite(roles: Role[]): boolean {
  return roles.some((role) => !WRITE_EXCLUDED_ROLES.includes(role));
}

export function canApprovePrices(roles: Role[]): boolean {
  return roles.some((role) => APPROVE_ROLES.includes(role));
}
