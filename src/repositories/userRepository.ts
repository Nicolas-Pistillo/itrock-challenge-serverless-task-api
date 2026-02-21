import { getDatabase } from '../database/connection';
import { UserRow } from '../types';

export function findByUsername(username: string): UserRow | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as UserRow | undefined;
  return row ?? null;
}
