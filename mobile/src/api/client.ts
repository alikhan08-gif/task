// Bu demo/sandbox uchun. Productionda API manzili environment o'zgaruvchisidan olinadi.
const API_BASE_URL = 'http://localhost:3000/api/v1';

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
  streak: { current: number; longest: number };
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
};
