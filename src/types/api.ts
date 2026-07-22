export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string> | null;
}
