import Database from 'better-sqlite3';
import { initSchema } from '@/database/schema';

// Mock the connection module to use in-memory DB
let testDb: Database.Database;

jest.mock('@/database/connection', () => ({
  getDatabase: () => testDb,
}));

import { TaskRepository } from '@/repositories/taskRepository';

describe('TaskRepository', () => {
  let repo: TaskRepository;

  beforeEach(() => {
    testDb = new Database(':memory:');
    initSchema(testDb);
    repo = new TaskRepository();
  });

  afterEach(() => {
    testDb.close();
  });

  describe('create', () => {
    it('should create a task and return it', () => {
      const task = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Test task' });
      expect(task.title).toBe('Test task');
      expect(task.userId).toBe('58ccc641-49bb-43af-b53f-f9b76764985f');
      expect(task.completed).toBe(false);
      expect(task.description).toBe('');
    });

    it('should create a task with description', () => {
      const task = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Test', description: 'A description' });
      expect(task.description).toBe('A description');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent task', () => {
      expect(repo.findById('non-existent')).toBeNull();
    });

    it('should return the task by id', () => {
      const created = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Find me' });
      const found = repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Find me');
    });
  });

  describe('findAllByUserId', () => {
    it('should return only tasks for the given user', () => {
      repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'User 1 task' });
      repo.create('d7af2463-edcf-468f-b303-bfbe4da895bc', { title: 'User 2 task' });

      const { tasks, total } = repo.findAllByUserId('58ccc641-49bb-43af-b53f-f9b76764985f');
      expect(tasks).toHaveLength(1);
      expect(total).toBe(1);
      expect(tasks[0].title).toBe('User 1 task');
    });

    it('should paginate results', () => {
      for (let i = 0; i < 15; i++) {
        repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: `Task ${i}` });
      }

      const page1 = repo.findAllByUserId('58ccc641-49bb-43af-b53f-f9b76764985f', { page: 1, limit: 5 });
      expect(page1.tasks).toHaveLength(5);
      expect(page1.total).toBe(15);

      const page3 = repo.findAllByUserId('58ccc641-49bb-43af-b53f-f9b76764985f', { page: 3, limit: 5 });
      expect(page3.tasks).toHaveLength(5);
    });

    it('should filter by completed status', () => {
      const task = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Done' });
      repo.update(task.id, { completed: true });
      repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Not done' });

      const { tasks } = repo.findAllByUserId('58ccc641-49bb-43af-b53f-f9b76764985f', { completed: true });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Done');
    });
  });

  describe('update', () => {
    it('should update task fields', () => {
      const task = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Original' });
      const updated = repo.update(task.id, { title: 'Updated', completed: true });

      expect(updated!.title).toBe('Updated');
      expect(updated!.completed).toBe(true);
    });

    it('should return null for non-existent task', () => {
      expect(repo.update('non-existent', { title: 'X' })).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing task', () => {
      const task = repo.create('58ccc641-49bb-43af-b53f-f9b76764985f', { title: 'Delete me' });
      expect(repo.delete(task.id)).toBe(true);
      expect(repo.findById(task.id)).toBeNull();
    });

    it('should return false for non-existent task', () => {
      expect(repo.delete('non-existent')).toBe(false);
    });
  });

  describe('createMany', () => {
    it('should create multiple tasks in a transaction', () => {
      const tasks = repo.createMany('58ccc641-49bb-43af-b53f-f9b76764985f', [
        { title: 'Task 1' },
        { title: 'Task 2' },
        { title: 'Task 3' },
      ]);

      expect(tasks).toHaveLength(3);
      const { total } = repo.findAllByUserId('58ccc641-49bb-43af-b53f-f9b76764985f');
      expect(total).toBe(3);
    });
  });
});
