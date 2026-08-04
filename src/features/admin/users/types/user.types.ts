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
export interface UserCreateFormValues {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleNames: string[];
}

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
