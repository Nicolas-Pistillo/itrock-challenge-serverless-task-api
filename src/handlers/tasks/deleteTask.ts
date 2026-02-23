import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { deleteTask } from '../../services/taskService';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { success } from '../../utils/httpResponse';
import { AuthenticatedEvent } from '../../types';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const taskId = event.pathParameters!.id;
  deleteTask(event.auth.userId, taskId);
  return success({ message: 'Task deleted successfully' });
};

export const handler = middy(baseHandler)
  .use(errorMiddleware())
  .use(authMiddleware());
