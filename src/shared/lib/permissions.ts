import type { AuthUser, Role } from '../../types/auth';

// Only VIEWER lacks COST_WRITE — every other role can create/update/delete.
const WRITE_EXCLUDED_ROLES: Role[] = ['VIEWER'];

// COST_APPROVE is narrower than COST_WRITE: only these three may approve or
// reject a pending resource price.
const APPROVE_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'EXPERT'];

// VIEW_ALL_ORGANIZATION_RESOURCES isn't exposed as its own permission name in
// `roles` — only SUPER_ADMIN/ADMIN carry it (backend migration 025), so role
// membership doubles as the gate for the entire admin panel.
const CENTRAL_ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];

export function canWrite(roles: Role[]): boolean {
  return roles.some((role) => !WRITE_EXCLUDED_ROLES.includes(role));
}

export function canApprovePrices(roles: Role[]): boolean {
  return roles.some((role) => APPROVE_ROLES.includes(role));
}

export function isCentralAdmin(roles: Role[]): boolean {
  return roles.some((role) => CENTRAL_ADMIN_ROLES.includes(role));
}

// "Mənim Resurslarım" is a vendor-facing submission workflow — only
// meaningful for users acting on behalf of a manufacturer/supplier
// organization (actorType ORGANIZATION), not central staff or individuals.
export function isOrganizationActor(user: AuthUser | null): boolean {
  return user?.actorType === 2;
}
