import { apiGet, apiPost } from './httpClient';
import type { AuthTokens, AuthUser, LoginFormValues } from '../types/auth';

export function login({ username, password }: LoginFormValues): Promise<AuthTokens> {
  return apiPost<AuthTokens>('/api/auth/login', { username, password });
}

export function refresh(refreshToken: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>('/api/auth/refresh', { refreshToken });
}

export function logout(refreshToken: string): Promise<void> {
  return apiPost<void>('/api/auth/logout', { refreshToken });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/auth/me');
}
