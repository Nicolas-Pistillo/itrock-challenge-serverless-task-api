import { TaskRepository } from '../repositories/taskRepository';
import { Task, CreateTaskInput, UpdateTaskInput, ListTasksQuery, PaginationMeta } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const taskRepository = new TaskRepository();

export function listTasks(
  userId: string,
  query: ListTasksQuery,
): { tasks: Task[]; meta: PaginationMeta } {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const { tasks, total } = taskRepository.findAllByUserId(userId, { ...query, page, limit });

  return {
    tasks,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function createTask(userId: string, input: CreateTaskInput): Task {
  return taskRepository.create(userId, input);
}

export function getTask(userId: string, taskId: string): Task {
  const task = taskRepository.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  if (task.userId !== userId) throw new ForbiddenError('You do not own this task');
  return task;
}

export function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Task {
  const task = taskRepository.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  if (task.userId !== userId) throw new ForbiddenError('You do not own this task');

  return taskRepository.update(taskId, input)!;
}

export function deleteTask(userId: string, taskId: string): void {
  const task = taskRepository.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  if (task.userId !== userId) throw new ForbiddenError('You do not own this task');

  taskRepository.delete(taskId);
}

export function importTasks(userId: string, tasks: CreateTaskInput[]): Task[] {
  return taskRepository.createMany(userId, tasks);
}
