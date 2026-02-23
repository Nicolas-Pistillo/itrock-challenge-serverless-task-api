import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyResult } from 'aws-lambda';
import { createTask } from '../../services/taskService';
import { createTaskSchema } from '../../schemas/taskSchemas';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validationMiddleware } from '../../middleware/validationMiddleware';
import { created } from '../../utils/httpResponse';
import { AuthenticatedEvent, CreateTaskInput } from '../../types';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const input = event.body as unknown as CreateTaskInput;
  const task = createTask(event.auth.userId, input);
  return created(task);
};

export const handler = middy(baseHandler)
  .use(errorMiddleware())
  .use(jsonBodyParser())
  .use(authMiddleware())
  .use(validationMiddleware({ body: createTaskSchema }));
