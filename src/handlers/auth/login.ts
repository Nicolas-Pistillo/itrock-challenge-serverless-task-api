import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { login } from '../../services/authService';
import { loginSchema } from '../../schemas/authSchemas';
import { errorMiddleware } from '../../middleware/errorMiddleware';
import { validationMiddleware } from '../../middleware/validationMiddleware';
import { success } from '../../utils/httpResponse';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { username, password } = event.body as unknown as { username: string; password: string };
  const result = login(username, password);
  return success(result);
};

export const handler = middy(baseHandler)
  .use(errorMiddleware())
  .use(jsonBodyParser())
  .use(validationMiddleware({ body: loginSchema }));
