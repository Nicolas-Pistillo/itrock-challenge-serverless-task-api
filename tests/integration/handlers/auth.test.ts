import Database from 'better-sqlite3';
import { initSchema } from '@/database/schema';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

let testDb: Database.Database;

jest.mock('@/database/connection', () => ({
  getDatabase: () => testDb,
}));

import { handler } from '@/handlers/auth/login';

function makeEvent(body: Record<string, unknown>): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/auth/login',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as never,
    resource: '',
  };
}

const context = {} as Context;

describe('POST /auth/login', () => {
  beforeEach(() => {
    testDb = new Database(':memory:');
    initSchema(testDb);
  });

  afterEach(() => {
    testDb.close();
  });

  it('should return 200 with a token for valid credentials', async () => {
    const result = await handler(makeEvent({ username: 'admin', password: 'password123' }), context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it('should return 401 for invalid credentials', async () => {
    const result = await handler(makeEvent({ username: 'admin', password: 'wrong' }), context);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 422 for missing username', async () => {
    const result = await handler(makeEvent({ password: 'password123' }), context);
    expect(result.statusCode).toBe(422);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(false);
  });

  it('should return 422 for empty body', async () => {
    const result = await handler(makeEvent({}), context);
    expect(result.statusCode).toBe(422);
  });
});
