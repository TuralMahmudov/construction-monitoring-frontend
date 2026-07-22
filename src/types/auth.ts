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
  roles: Role[];
}
