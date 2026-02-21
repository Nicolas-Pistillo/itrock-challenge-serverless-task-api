import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { listTasks } from '../../services/taskService';
import { listTasksQuerySchema } from '../../schemas/taskSchemas';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validationMiddleware } from '../../middleware/validationMiddleware';
import { success } from '../../utils/httpResponse';
import { AuthenticatedEvent } from '../../types';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const query = (event.queryStringParameters || {}) as Record<string, unknown>;
  const { tasks, meta } = listTasks(event.auth.userId, query);
  return success(tasks, 200, meta);
};

export const handler = middy(baseHandler as never)
  .use(errorMiddleware())
  .use(authMiddleware())
  .use(validationMiddleware({ query: listTasksQuerySchema }));
