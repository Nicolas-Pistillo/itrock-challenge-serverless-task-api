import { randomUUID } from 'crypto';
import { getDatabase } from '../database/connection';
import { Task, TaskRow, CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../types';

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TaskRepository {
  findAllByUserId(
    userId: string,
    query: ListTasksQuery = {},
  ): { tasks: Task[]; total: number } {
    const db = getDatabase();
    const { page = 1, limit = 10, completed, from, to } = query;

    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (completed !== undefined) {
      conditions.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (from) {
      conditions.push('created_at >= ?');
      params.push(from);
    }

    if (to) {
      conditions.push('created_at <= ?');
      params.push(to);
    }

    const where = conditions.join(' AND ');

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM tasks WHERE ${where}`)
      .get(...[params]) as { count: number };
    const total = countRow.count;

    const offset = (page - 1) * limit;
    const rows = db
      .prepare(
        `SELECT * FROM tasks WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...[...params, limit, offset]) as TaskRow[];

    return { tasks: rows.map(rowToTask), total };
  }

  findById(id: string): Task | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  }

  create(userId: string, input: CreateTaskInput): Task {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    ).run(id, userId, input.title, input.description || '', now, now);

    return this.findById(id)!;
  }

  createMany(userId: string, inputs: CreateTaskInput[]): Task[] {
    const db = getDatabase();
    const insert = db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    );

    const ids: string[] = [];
    const now = new Date().toISOString();

    const transaction = db.transaction(() => {
      for (const input of inputs) {
        const id = randomUUID();
        ids.push(id);
        insert.run(id, userId, input.title, input.description || '', now, now);
      }
    });

    transaction();

    return ids.map((id) => this.findById(id)!);
  }

  update(id: string, input: UpdateTaskInput): Task | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = ['updated_at = ?'];
    const params: unknown[] = [new Date().toISOString()];

    if (input.title !== undefined) {
      fields.push('title = ?');
      params.push(input.title);
    }

    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }

    if (input.completed !== undefined) {
      fields.push('completed = ?');
      params.push(input.completed ? 1 : 0);
    }

    params.push(id);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    return this.findById(id)!;
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
