import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';
import { clearAccessToken, getAccessToken } from './tokenStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const NO_AUTH_HEADER_PATHS = ['/api/auth/login', '/api/auth/refresh'];
const NO_REFRESH_RETRY_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

export class ApiError extends Error {
  readonly status: number;
  readonly validationErrors: Record<string, string> | null;

  constructor(status: number, message: string, validationErrors: Record<string, string> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface AuthHandlers {
  refresh: () => Promise<string>;
  onAuthFailure: () => void;
}

let authHandlers: AuthHandlers | null = null;

export function registerAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export const httpClient = axios.create({ baseURL: API_BASE_URL });

httpClient.interceptors.request.use((config) => {
  const path = config.url ?? '';
  if (!NO_AUTH_HEADER_PATHS.some((p) => path.includes(p))) {
    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const path = originalRequest?.url ?? '';
    const status = error.response?.status;

    const canRetryWithRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !NO_REFRESH_RETRY_PATHS.some((p) => path.includes(p)) &&
      authHandlers;

    if (canRetryWithRefresh) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await authHandlers!.refresh();
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return httpClient(originalRequest);
      } catch {
        clearAccessToken();
        authHandlers?.onAuthFailure();
        return Promise.reject(toApiError(error));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

function toApiError(error: AxiosError<ApiErrorResponse>): ApiError {
  const data = error.response?.data;
  if (data) {
    return new ApiError(data.status, data.message, data.validationErrors ?? null);
  }
  return new ApiError(error.response?.status ?? 0, error.message);
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await httpClient.get<ApiSuccessResponse<T>>(url, { params });
  return response.data.data as T;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await httpClient.post<ApiSuccessResponse<T>>(url, body);
  return response.data.data as T;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await httpClient.put<ApiSuccessResponse<T>>(url, body);
  return response.data.data as T;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await httpClient.patch<ApiSuccessResponse<T>>(url, body);
  return response.data.data as T;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await httpClient.delete<ApiSuccessResponse<T>>(url);
  return response.data.data as T;
}
