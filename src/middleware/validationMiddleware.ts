import middy from '@middy/core';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationOptions {
  body?: z.ZodType;
  query?: z.ZodType;
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    })
    .join(', ');
}

export const validationMiddleware = (schemas: ValidationOptions): middy.MiddlewareObj => ({
  before: async (request) => {
    const event = request.event as Record<string, unknown>;

    if (schemas.body) {
      const result = schemas.body.safeParse(event.body);
      if (!result.success) {
        throw new ValidationError(formatZodError(result.error));
      }
      event.body = result.data;
    }

    if (schemas.query) {
      const raw = (event.queryStringParameters as Record<string, string>) || {};
      const result = schemas.query.safeParse(raw);
      if (!result.success) {
        throw new ValidationError(formatZodError(result.error));
      }
      event.queryStringParameters = result.data;
    }
  },
});
