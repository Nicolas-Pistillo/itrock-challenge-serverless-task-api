export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface UserRow {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface ListTasksQuery {
  page?: number;
  limit?: number;
  completed?: boolean;
  from?: string;
  to?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  errors?: ValidationIssue[];
  meta?: PaginationMeta;
}

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface AuthenticatedEvent {
  auth: AuthPayload;
  body: unknown;
  pathParameters: Record<string, string> | null;
  queryStringParameters: Record<string, string> | null;
}
