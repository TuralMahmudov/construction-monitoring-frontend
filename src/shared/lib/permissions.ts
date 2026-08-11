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

// Sənəd İdxalı module (FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 0).
export const PERMISSIONS = {
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_REVIEW: 'DOCUMENT_REVIEW',
  COST_WRITE: 'COST_WRITE',
  VIEW_ALL_ORGANIZATION_RESOURCES: 'VIEW_ALL_ORGANIZATION_RESOURCES',
} as const;

function hasPermission(user: AuthUser | null, permission: string): boolean {
  return (user?.permissions ?? []).includes(permission);
}

// Vendor (organization) accounts uploading their own documents. A central
// account (organizationId === null) never sees this, even with the
// permission — backend 400s that combination (§0).
export function canUploadDocuments(user: AuthUser | null): boolean {
  return isOrganizationActor(user) && hasPermission(user, PERMISSIONS.DOCUMENT_UPLOAD);
}

// Central document list + lock/status actions.
export function canReviewDocuments(user: AuthUser | null): boolean {
  return hasPermission(user, PERMISSIONS.DOCUMENT_REVIEW);
}

// "Emal et" bulk resource/price creation additionally needs COST_WRITE (to
// write resource-prices) and VIEW_ALL_ORGANIZATION_RESOURCES (to create on
// behalf of the document's organization) — all three together (§0).
export function canProcessDocuments(user: AuthUser | null): boolean {
  return (
    hasPermission(user, PERMISSIONS.DOCUMENT_REVIEW) &&
    hasPermission(user, PERMISSIONS.COST_WRITE) &&
    hasPermission(user, PERMISSIONS.VIEW_ALL_ORGANIZATION_RESOURCES)
  );
}
