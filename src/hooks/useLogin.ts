import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ApiError } from '../services/httpClient';
import type { LoginFormValues } from '../types/auth';

const INVALID_CREDENTIALS_MESSAGE = 'İstifadəçi adı və ya şifrə yanlışdır.';
const GENERIC_ERROR_MESSAGE = 'Sistem xətası baş verdi. Yenidən cəhd edin.';
const NETWORK_ERROR_MESSAGE = 'Serverlə əlaqə qurula bilmədi. İnternet bağlantınızı yoxlayın.';

// Backend validation messages arrive in English; the UI must stay fully
// Azerbaijani, so only the flagged field names are trusted, not their text.
const FIELD_MESSAGES: Record<string, string> = {
  username: 'İstifadəçi adı daxil edin.',
  password: 'Şifrəni daxil edin.',
};
const DEFAULT_FIELD_MESSAGE = 'Bu sahə düzgün doldurulmayıb.';

export type LoginFieldErrors = Partial<Record<'username' | 'password', string>>;

export interface UseLoginResult {
  submitLogin: (values: LoginFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: LoginFieldErrors | null;
}

export function useLogin(): UseLoginResult {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors | null>(null);

  const submitLogin = useCallback(
    async (values: LoginFormValues) => {
      setIsLoading(true);
      setError(null);
      setFieldErrors(null);

      try {
        await login(values);
        navigate('/resource-categories');
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 400 && err.validationErrors) {
            const mapped: LoginFieldErrors = {};
            for (const field of Object.keys(err.validationErrors)) {
              if (field === 'username' || field === 'password') {
                mapped[field] = FIELD_MESSAGES[field] ?? DEFAULT_FIELD_MESSAGE;
              }
            }
            setFieldErrors(mapped);
          } else if (err.status === 401) {
            setError(INVALID_CREDENTIALS_MESSAGE);
          } else if (err.status === 0) {
            setError(NETWORK_ERROR_MESSAGE);
          } else {
            setError(GENERIC_ERROR_MESSAGE);
          }
        } else {
          setError(GENERIC_ERROR_MESSAGE);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate],
  );

  return { submitLogin, isLoading, error, fieldErrors };
}
