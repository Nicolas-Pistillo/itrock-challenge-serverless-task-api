import Database from 'better-sqlite3';
import { initSchema } from '@/database/schema';
import { UnauthorizedError } from '@/utils/errors';

let testDb: Database.Database;

jest.mock('@/database/connection', () => ({
  getDatabase: () => testDb,
}));

import { login, verifyToken } from '@/services/authService';

describe('AuthService', () => {
  beforeEach(() => {
    testDb = new Database(':memory:');
    initSchema(testDb);
  });

  afterEach(() => {
    testDb.close();
  });

  describe('login', () => {
    it('should return a JWT token for valid credentials', () => {
      const result = login('admin', 'password123');
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
    });

    it('should throw UnauthorizedError for invalid username', () => {
      expect(() => login('invalid', 'password123')).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', () => {
      expect(() => login('admin', 'wrong')).toThrow(UnauthorizedError);
    });
  });

  describe('verifyToken', () => {
    it('should return payload for a valid token', () => {
      const { token } = login('admin', 'password123');
      const payload = verifyToken(token);
      expect(payload.userId).toBe('58ccc641-49bb-43af-b53f-f9b76764985f');
      expect(payload.username).toBe('admin');
    });

    it('should throw UnauthorizedError for an invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });
});
