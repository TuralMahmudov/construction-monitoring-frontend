const REFRESH_TOKEN_KEY = 'ccms.refreshToken';
const REMEMBER_ME_KEY = 'ccms.rememberMe';

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

export function saveRefreshToken(token: string, rememberMe: boolean): void {
  clearRefreshToken();
  const storage = getStorage(rememberMe);
  storage.setItem(REFRESH_TOKEN_KEY, token);
  storage.setItem(REMEMBER_ME_KEY, String(rememberMe));
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isRememberMeEnabled(): boolean {
  return (
    localStorage.getItem(REMEMBER_ME_KEY) === 'true' ||
    sessionStorage.getItem(REMEMBER_ME_KEY) === 'true'
  );
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REMEMBER_ME_KEY);
}
