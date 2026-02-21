import Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at);

    INSERT OR IGNORE INTO users (id, username, password)
    VALUES ('58ccc641-49bb-43af-b53f-f9b76764985f', 'admin', 'password123');

    INSERT OR IGNORE INTO users (id, username, password)
    VALUES ('d7af2463-edcf-468f-b303-bfbe4da895bc', 'user', 'password456');
  `);
}
