// FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 3 — this list is central staff
// only. Vendor login accounts never appear here, they live under
// /api/organizations instead. `organizationId` deliberately omitted: since
// FRONTEND_AI_PROMPT_CENTRAL_ORG_AND_ROLES.md § 2 (2026-09-07) it's always
// populated (points at the fixed "Mərkəz" org row) so it carries no signal
// on this already-central-only list — don't add it back as a "Təşkilat"
// column, it would always show the same value.
export interface CentralUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  actorType: 1;
  roles: string[];
}

// POST /api/users — no organizationId/actorType field: the server always
// forces actorType=INDIVIDUAL and its own organizationId (the fixed
// "Mərkəz" row since 2026-09-07, previously null), sending them is ignored.
// `email` stays mandatory here (unlike Organization's — bax
// FRONTEND_AI_PROMPT_ORGANIZATION_EMAIL.md § 5, this endpoint is explicitly
// untouched by that change). `confirmPassword` is form-only.
export interface UserCreateFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  roleNames: string[];
}

// What actually goes over the wire — `confirmPassword` is form-only, the API
// has never heard of it.
export type UserCreatePayload = Omit<UserCreateFormValues, 'confirmPassword'>;

// PUT /api/users/{id} — no password field (not supported by this endpoint).
// roleNames fully replaces the existing role set, it's not additive.
export interface UserUpdateFormValues {
  firstName: string;
  lastName: string;
  enabled: boolean;
  accountNonLocked: boolean;
  roleNames: string[];
}

export interface UserSearchParams {
  username?: string;
  email?: string;
  enabled?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
