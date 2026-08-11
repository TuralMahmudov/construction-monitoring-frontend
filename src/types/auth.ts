export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'EXPERT'
  | 'ANALYST'
  | 'OPERATOR'
  | 'VIEWER';

export interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  organizationId: string | null;
  actorType: 1 | 2;
  roles: Role[];
  // Added 2026-08-10 (FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 0) — union of
  // every permission granted by the user's roles. Closes the previously-open
  // "no permissions array" gap; DOCUMENT_UPLOAD/DOCUMENT_REVIEW/COST_WRITE/
  // VIEW_ALL_ORGANIZATION_RESOURCES gating reads this directly instead of
  // hardcoding role names.
  permissions: string[];
}
