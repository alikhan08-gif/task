import { tokenStore } from './tokenStore';

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

// Access token qisqa umr ko'radi (15 daqiqa). Har bir himoyalangan so'rov shu
// orqali yuboriladi: 401 kelsa, refresh token bilan avtomatik yangi token
// olinadi va so'rov bir marta qaytadan urinib ko'riladi — foydalanuvchi buni
// sezmaydi. Refresh ham muvaffaqiyatsiz bo'lsa, sessiya tozalanadi (AuthContext
// buni tokenStore orqali kuzatib, kirish ekraniga qaytaradi).
let refreshInFlight: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  const refreshToken = tokenStore.current?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, null, "Sessiya tugagan, qaytadan kiring");
  }
  const result = await request<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  await tokenStore.set(result);
}

async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = tokenStore.current?.accessToken;
  if (!accessToken) {
    throw new ApiError(401, null, 'Tizimga kirilmagan');
  }

  try {
    return await request<T>(path, options, accessToken);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err;
    }

    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshTokens().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
    } catch {
      await tokenStore.set(null);
      throw err;
    }

    const newAccessToken = tokenStore.current?.accessToken;
    if (!newAccessToken) {
      throw err;
    }
    return request<T>(path, options, newAccessToken);
  }
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: { id: string; email: string; timezone: string; createdAt: string };
};

export type NotificationLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ProfileResponse = {
  id: string;
  email: string;
  timezone: string;
  notificationLevel: NotificationLevel;
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
  refresh: (refreshToken: string) =>
    request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  profile: () => authedRequest<ProfileResponse>('/profile'),

  listTasks: () => authedRequest<Task[]>('/tasks'),
  createTask: (input: CreateTaskInput) =>
    authedRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (id: string, input: Partial<CreateTaskInput>) =>
    authedRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  completeTask: (id: string) =>
    authedRequest<Task>(`/tasks/${id}/complete`, { method: 'POST' }),
  deleteTask: (id: string) =>
    authedRequest<{ id: string; deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  telegramLink: () =>
    authedRequest<{ token: string; deepLink: string }>('/telegram/link', { method: 'POST' }),

  updateTimezone: (timezone: string) =>
    authedRequest<ProfileResponse>('/profile/timezone', {
      method: 'PATCH',
      body: JSON.stringify({ timezone }),
    }),
  updateNotificationLevel: (notificationLevel: NotificationLevel) =>
    authedRequest<ProfileResponse>('/profile/notification-level', {
      method: 'PATCH',
      body: JSON.stringify({ notificationLevel }),
    }),
};
