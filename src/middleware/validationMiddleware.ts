import middy from '@middy/core';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';
import { ValidationIssue } from '../types';

interface ValidationOptions {
  body?: z.ZodType;
  query?: z.ZodType;
}

function mapZodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((e) => ({
    field: e.path.join('.'),
    code: e.code,
    message: e.message,
  }));
}

export const validationMiddleware = (schemas: ValidationOptions): middy.MiddlewareObj => ({
  before: async (request) => {
    const event = request.event as Record<string, unknown>;

    if (schemas.body) {
      const result = schemas.body.safeParse(event.body);
      if (!result.success) {
        throw new ValidationError(mapZodIssues(result.error));
      }
      event.body = result.data;
    }

    if (schemas.query) {
      const raw = (event.queryStringParameters as Record<string, string>) || {};
      const result = schemas.query.safeParse(raw);
      if (!result.success) {
        throw new ValidationError(mapZodIssues(result.error));
      }
      event.queryStringParameters = result.data;
    }
  },
});
