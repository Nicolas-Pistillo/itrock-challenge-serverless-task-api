import { NotFoundError, ForbiddenError } from '@/utils/errors';

const mockRepo = {
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/repositories/taskRepository', () => ({
  TaskRepository: jest.fn().mockImplementation(() => mockRepo),
}));

import { listTasks, createTask, updateTask, deleteTask, getTask, importTasks } from '@/services/taskService';

const sampleTask = {
  id: 'task-1',
  userId: 'user-1',
  title: 'Test task',
  description: '',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTasks', () => {
    it('should return tasks with pagination meta', () => {
      mockRepo.findAllByUserId.mockReturnValue({ tasks: [sampleTask], total: 1 });

      const result = listTasks('user-1', { page: 1, limit: 10 });
      expect(result.tasks).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('createTask', () => {
    it('should create and return a task', () => {
      mockRepo.create.mockReturnValue(sampleTask);

      const result = createTask('user-1', { title: 'Test task' });
      expect(result).toEqual(sampleTask);
      expect(mockRepo.create).toHaveBeenCalledWith('user-1', { title: 'Test task' });
    });
  });

  describe('getTask', () => {
    it('should return the task if owned by user', () => {
      mockRepo.findById.mockReturnValue(sampleTask);
      expect(getTask('user-1', 'task-1')).toEqual(sampleTask);
    });

    it('should throw NotFoundError if task does not exist', () => {
      mockRepo.findById.mockReturnValue(null);
      expect(() => getTask('user-1', 'task-1')).toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if task belongs to another user', () => {
      mockRepo.findById.mockReturnValue(sampleTask);
      expect(() => getTask('user-2', 'task-1')).toThrow(ForbiddenError);
    });
  });

  describe('updateTask', () => {
    it('should update and return the task', () => {
      const updated = { ...sampleTask, title: 'Updated' };
      mockRepo.findById.mockReturnValue(sampleTask);
      mockRepo.update.mockReturnValue(updated);

      const result = updateTask('user-1', 'task-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundError if task does not exist', () => {
      mockRepo.findById.mockReturnValue(null);
      expect(() => updateTask('user-1', 'task-1', { title: 'X' })).toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if not owner', () => {
      mockRepo.findById.mockReturnValue(sampleTask);
      expect(() => updateTask('user-2', 'task-1', { title: 'X' })).toThrow(ForbiddenError);
    });
  });

  describe('deleteTask', () => {
    it('should delete the task', () => {
      mockRepo.findById.mockReturnValue(sampleTask);
      mockRepo.delete.mockReturnValue(true);

      deleteTask('user-1', 'task-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('task-1');
    });

    it('should throw NotFoundError if task does not exist', () => {
      mockRepo.findById.mockReturnValue(null);
      expect(() => deleteTask('user-1', 'task-1')).toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if not owner', () => {
      mockRepo.findById.mockReturnValue(sampleTask);
      expect(() => deleteTask('user-2', 'task-1')).toThrow(ForbiddenError);
    });
  });

  describe('importTasks', () => {
    it('should import multiple tasks', () => {
      const tasks = [sampleTask, { ...sampleTask, id: 'task-2' }];
      mockRepo.createMany.mockReturnValue(tasks);

      const result = importTasks('user-1', [{ title: 'T1' }, { title: 'T2' }]);
      expect(result).toHaveLength(2);
    });
  });
});
