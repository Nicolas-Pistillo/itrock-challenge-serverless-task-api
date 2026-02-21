import middy from '@middy/core';
import { AppError } from '../utils/errors';
import { error } from '../utils/httpResponse';

export const errorMiddleware = (): middy.MiddlewareObj => ({
  onError: async (request) => {
    const err = request.error as Error & { statusCode?: number };

    if (err instanceof AppError) {
      request.response = error(err.statusCode, err.code, err.message);
      return;
    }

    // Middy built-in errors (jsonBodyParser, etc.) carry their own statusCode
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      request.response = error(422, 'VALIDATION_ERROR', err.message);
      return;
    }

    console.error('Unhandled error:', err);
    request.response = error(500, 'INTERNAL_ERROR', 'Internal server error');
  },
});
