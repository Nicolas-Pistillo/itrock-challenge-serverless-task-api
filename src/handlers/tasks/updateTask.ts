import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyResult } from 'aws-lambda';
import { updateTask } from '../../services/taskService';
import { updateTaskSchema } from '../../schemas/taskSchemas';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validationMiddleware } from '../../middleware/validationMiddleware';
import { success } from '../../utils/httpResponse';
import { AuthenticatedEvent, UpdateTaskInput } from '../../types';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const taskId = event.pathParameters!.id;
  const input = event.body as unknown as UpdateTaskInput;
  const task = updateTask(event.auth.userId, taskId, input);
  return success(task);
};

export const handler = middy(baseHandler as never)
  .use(errorMiddleware())
  .use(jsonBodyParser())
  .use(authMiddleware())
  .use(validationMiddleware({ body: updateTaskSchema }));
