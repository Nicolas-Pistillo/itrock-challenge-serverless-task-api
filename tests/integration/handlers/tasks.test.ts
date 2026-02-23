import Database from 'better-sqlite3';
import { initSchema } from '@/database/schema';
import { login } from '@/services/authService';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

let testDb: Database.Database;

jest.mock('@/database/connection', () => ({
  getDatabase: () => testDb,
}));

import { handler as createHandler } from '@/handlers/tasks/createTask';
import { handler as listHandler } from '@/handlers/tasks/listTasks';
import { handler as updateHandler } from '@/handlers/tasks/updateTask';
import { handler as deleteHandler } from '@/handlers/tasks/deleteTask';

const context = {} as Context;

function getToken(): string {
  return login('admin', 'password123').token;
}

function makeEvent(
  overrides: Omit<Partial<APIGatewayProxyEvent>, 'body'> & { body?: unknown },
): any {
  const { body, ...rest } = overrides;
  return {
    body: typeof body === 'string' ? body : JSON.stringify(body ?? null),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/tasks',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as never,
    resource: '',
    ...rest,
  };
}

describe('Task Handlers Integration', () => {
  beforeEach(() => {
    testDb = new Database(':memory:');
    initSchema(testDb);
  });

  afterEach(() => {
    testDb.close();
  });

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const result = await createHandler(
        makeEvent({ body: { title: 'New task', description: 'Details' }, httpMethod: 'POST' }),
        context,
      );
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.data.title).toBe('New task');
      expect(body.data.description).toBe('Details');
      expect(body.data.completed).toBe(false);
    });

    it('should return 422 for missing title', async () => {
      const result = await createHandler(
        makeEvent({ body: { description: 'No title' }, httpMethod: 'POST' }),
        context,
      );
      expect(result.statusCode).toBe(422);
    });

    it('should return 422 for empty body', async () => {
      const event = makeEvent({ httpMethod: 'POST' });
      event.body = null as never;
      const result = await createHandler(event, context);
      expect(result.statusCode).toBe(422);
    });

    it('should return 401 without auth header', async () => {
      const event = makeEvent({ body: { title: 'Test' }, httpMethod: 'POST' });
      event.headers = { 'Content-Type': 'application/json' };
      const result = await createHandler(event, context);
      expect(result.statusCode).toBe(401);
    });
  });

  describe('GET /tasks', () => {
    it('should return empty list initially', async () => {
      const result = await listHandler(makeEvent({ httpMethod: 'GET' }), context);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return created tasks with pagination', async () => {
      // Create some tasks first
      for (let i = 0; i < 3; i++) {
        await createHandler(
          makeEvent({ body: { title: `Task ${i}` }, httpMethod: 'POST' }),
          context,
        );
      }

      const result = await listHandler(
        makeEvent({ httpMethod: 'GET', queryStringParameters: { page: '1', limit: '2' } }),
        context,
      );
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(3);
      expect(body.meta.totalPages).toBe(2);
    });
  });

  describe('PATCH /tasks/{id}', () => {
    it('should update a task', async () => {
      // Create a task
      const createResult = await createHandler(
        makeEvent({ body: { title: 'Original' }, httpMethod: 'POST' }),
        context,
      );
      const taskId = JSON.parse(createResult.body).data.id;

      // Update it
      const result = await updateHandler(
        makeEvent({
          body: { title: 'Updated', completed: true },
          httpMethod: 'PATCH',
          pathParameters: { id: taskId },
        }),
        context,
      );
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.title).toBe('Updated');
      expect(body.data.completed).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      const result = await updateHandler(
        makeEvent({
          body: { title: 'X' },
          httpMethod: 'PATCH',
          pathParameters: { id: 'non-existent' },
        }),
        context,
      );
      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /tasks/{id}', () => {
    it('should delete a task', async () => {
      const createResult = await createHandler(
        makeEvent({ body: { title: 'To delete' }, httpMethod: 'POST' }),
        context,
      );
      const taskId = JSON.parse(createResult.body).data.id;

      const result = await deleteHandler(
        makeEvent({ httpMethod: 'DELETE', pathParameters: { id: taskId } }),
        context,
      );
      expect(result.statusCode).toBe(200);

      // Verify it's gone
      const listResult = await listHandler(makeEvent({ httpMethod: 'GET' }), context);
      const body = JSON.parse(listResult.body);
      expect(body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent task', async () => {
      const result = await deleteHandler(
        makeEvent({ httpMethod: 'DELETE', pathParameters: { id: 'non-existent' } }),
        context,
      );
      expect(result.statusCode).toBe(404);
    });
  });
});
