import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest, refresh as refreshRequest } from '../services/authService';
import { registerAuthHandlers } from '../services/httpClient';
import { clearAccessToken, getAccessToken, setAccessToken } from '../services/tokenStore';
import {
  clearRefreshToken,
  getStoredRefreshToken,
  isRememberMeEnabled,
  saveRefreshToken,
} from '../services/tokenStorage';
import type { AuthTokens, AuthUser, LoginFormValues } from '../types/auth';

// Refresh proactively before the access token actually expires, so a
// silent refresh in flight never races the token's real expiry.
const REFRESH_MARGIN_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const refreshTimerRef = useRef<number | undefined>(undefined);
  const refreshInFlightRef = useRef<Promise<string> | null>(null);
  // Always holds the latest performRefresh so the timer callback below
  // never closes over a stale version of it.
  const performRefreshRef = useRef<() => Promise<string>>(() =>
    Promise.reject(new Error('Refresh not initialized yet')),
  );

  const scheduleRefresh = useCallback((expiresIn: number) => {
    window.clearTimeout(refreshTimerRef.current);
    const delay = Math.max(expiresIn * 1000 - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS);
    refreshTimerRef.current = window.setTimeout(() => {
      performRefreshRef.current().catch(() => {
        // A failed proactive refresh is handled inside performRefresh itself
        // (session is cleared there); nothing further to do here.
      });
    }, delay);
  }, []);

  const applyTokens = useCallback(
    (tokens: AuthTokens, rememberMe: boolean) => {
      setAccessToken(tokens.accessToken);
      saveRefreshToken(tokens.refreshToken, rememberMe);
      scheduleRefresh(tokens.expiresIn);
    },
    [scheduleRefresh],
  );

  const clearSession = useCallback(() => {
    window.clearTimeout(refreshTimerRef.current);
    clearAccessToken();
    clearRefreshToken();
    setUser(null);
  }, []);

  const performRefresh = useCallback((): Promise<string> => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) {
      clearSession();
      return Promise.reject(new Error('No refresh token available'));
    }

    const promise = (async () => {
      try {
        const rememberMe = isRememberMeEnabled();
        const tokens = await refreshRequest(storedRefreshToken);
        applyTokens(tokens, rememberMe);
        return tokens.accessToken;
      } catch (err) {
        clearSession();
        throw err;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = promise;
    return promise;
  }, [applyTokens, clearSession]);

  useEffect(() => {
    performRefreshRef.current = performRefresh;
  }, [performRefresh]);

  useEffect(() => {
    registerAuthHandlers({ refresh: performRefresh, onAuthFailure: clearSession });
  }, [performRefresh, clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getStoredRefreshToken()) {
        setIsInitializing(false);
        return;
      }
      try {
        await performRefresh();
        const me = await getCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        // performRefresh already clears the session on failure.
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // Runs once on mount to restore a session from a persisted refresh token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (values: LoginFormValues) => {
      const tokens = await loginRequest(values);
      applyTokens(tokens, values.rememberMe);
      try {
        const me = await getCurrentUser();
        setUser(me);
      } catch (err) {
        clearSession();
        throw err;
      }
    },
    [applyTokens, clearSession],
  );

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    const storedRefreshToken = getStoredRefreshToken();
    try {
      if (accessToken && storedRefreshToken) {
        await logoutRequest(storedRefreshToken);
      }
    } catch {
      // Best effort: proceed to clear the local session regardless.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
    }),
    [user, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
