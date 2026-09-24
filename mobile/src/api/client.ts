// Mahalliy ishlab chiqish uchun EXPO_PUBLIC_API_URL bilan bekor qilinadi
// (masalan: EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1 npx expo start).
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://timeup-backend.onrender.com/api/v1';

export type ApiErrorBody = {
  error: { code: string; message: string | string[]; details: unknown };
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.error?.message
      ? Array.isArray(body.error.message)
        ? body.error.message.join(', ')
        : body.error.message
      : `So'rov muvaffaqiyatsiz (${response.status})`;
    throw new ApiError(response.status, body, message);
  }

  return body as T;
}

export type AuthResponse = {
  user: { id: string; email: string; timezone: string; createdAt: string };
  accessToken: string;
  refreshToken: string;
};

export type ProfileResponse = {
  id: string;
  email: string;
  timezone: string;
  createdAt: string;
  xp: number;
  telegramLinked: boolean;
  streak: { current: number; longest: number };
};

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'MISSED';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueAt?: string;
};

export const api = {
  register: (email: string, password: string, timezone: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, timezone }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  profile: (token: string) => request<ProfileResponse>('/profile', {}, token),

  listTasks: (token: string) => request<Task[]>('/tasks', {}, token),
  createTask: (token: string, input: CreateTaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }, token),
  updateTask: (token: string, id: string, input: Partial<CreateTaskInput>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, token),
  completeTask: (token: string, id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: 'POST' }, token),
  deleteTask: (token: string, id: string) =>
    request<{ id: string; deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }, token),

  telegramLink: (token: string) =>
    request<{ token: string; deepLink: string }>('/telegram/link', { method: 'POST' }, token),
};
