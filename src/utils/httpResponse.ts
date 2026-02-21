import { ApiResponse, PaginationMeta } from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export function success<T>(data: T, statusCode = 200, meta?: PaginationMeta) {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export function created<T>(data: T) {
  return success(data, 201);
}

export function error(statusCode: number, code: string, message: string) {
  const body: ApiResponse = {
    success: false,
    error: { code, message },
  };

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
