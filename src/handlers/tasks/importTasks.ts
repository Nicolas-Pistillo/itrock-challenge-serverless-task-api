import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { importTasks } from '../../services/taskService';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { created } from '../../utils/httpResponse';
import { AuthenticatedEvent } from '../../types';

const JSONPLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com/todos';

interface JsonPlaceholderTodo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const response = await fetch(JSONPLACEHOLDER_URL);
  const todos = (await response.json()) as JsonPlaceholderTodo[];

  const filtered = todos
    .filter((todo) => todo.userId === 1)
    .slice(0, 5)
    .map((todo) => ({
      title: todo.title,
      description: `Imported from JSONPlaceholder (original id: ${todo.id})`,
    }));

  const tasks = importTasks(event.auth.userId, filtered);
  return created(tasks);
};

export const handler = middy(baseHandler as never)
  .use(errorMiddleware())
  .use(authMiddleware());
