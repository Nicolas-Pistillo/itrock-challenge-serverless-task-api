import middy from '@middy/core';
import { verifyToken } from '../services/authService';
import { UnauthorizedError } from '../utils/errors';

export const authMiddleware = (): middy.MiddlewareObj => ({
  before: async (request) => {
    const event = request.event as Record<string, unknown>;
    const headers = (event.headers || {}) as Record<string, string>;

    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid Authorization format. Use: Bearer <token>');
    }

    const payload = verifyToken(token);
    (event as Record<string, unknown>).auth = payload;
  },
});
