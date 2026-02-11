export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

