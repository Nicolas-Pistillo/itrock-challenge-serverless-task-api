import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import { AuthPayload } from '../types';
import { findByUsername } from '../repositories/userRepository';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
}

export function login(username: string, password: string): { token: string } {
  const user = findByUsername(username);

  if (!user || user.password !== password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username } satisfies AuthPayload,
    getJwtSecret(),
    { expiresIn: '24h' },
  );

  return { token };
}

export function verifyToken(token: string): AuthPayload {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    return { userId: payload.userId, username: payload.username };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
