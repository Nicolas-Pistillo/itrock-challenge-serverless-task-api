import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional().default(''),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  completed: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuerySchemaInput = z.infer<typeof listTasksQuerySchema>;
