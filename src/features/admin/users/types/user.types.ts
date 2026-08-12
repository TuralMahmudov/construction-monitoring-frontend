// FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 3 — this list is central staff
// only (organizationId=NULL). Vendor login accounts never appear here, they
// live under /api/organizations instead.
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
// creates organizationId=null/actorType=INDIVIDUAL, sending them is ignored.
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
