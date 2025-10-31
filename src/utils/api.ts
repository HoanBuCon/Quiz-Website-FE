// Simple API client using fetch with JWT support

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  // No content
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// High-level API helpers
export const ClassesAPI = {
  listMine: (token: string) => apiRequest<any[]>(`/classes?mine=true`, { token }),
  listPublic: (token: string) => apiRequest<any[]>(`/classes`, { token }),
  create: (data: { name: string; description?: string; isPublic?: boolean }, token: string) =>
    apiRequest<any>(`/classes`, { method: 'POST', token, body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string; isPublic?: boolean }, token: string) =>
    apiRequest<any>(`/classes/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  remove: (id: string, token: string) => apiRequest<void>(`/classes/${id}`, { method: 'DELETE', token }),
  import: (payload: { classId?: string; quizId?: string }, token: string) =>
    apiRequest<any>(`/classes/import`, { method: 'POST', token, body: JSON.stringify(payload) }),
};

export const QuizzesAPI = {
  byClass: (classId: string, token: string) => apiRequest<any[]>(`/quizzes/by-class/${classId}`, { token }),
  create: (data: any, token: string) => apiRequest<any>(`/quizzes`, { method: 'POST', token, body: JSON.stringify(data) }),
  update: (id: string, data: any, token: string) => apiRequest<any>(`/quizzes/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  remove: (id: string, token: string) => apiRequest<void>(`/quizzes/${id}`, { method: 'DELETE', token }),
};

export const SessionsAPI = {
  start: (quizId: string, token: string) => apiRequest<any>(`/sessions/start`, { method: 'POST', token, body: JSON.stringify({ quizId }) }),
  submit: (payload: { quizId: string; answers: Record<string, string[]>; timeSpent: number }, token: string) =>
    apiRequest<any>(`/sessions/submit`, { method: 'POST', token, body: JSON.stringify(payload) }),
  byQuiz: (quizId: string, token: string) => apiRequest<any[]>(`/sessions/by-quiz/${quizId}`, { token }),
};

export const FilesAPI = {
  listMine: (token: string) => apiRequest<any[]>(`/files`, { token }),
  upload: (data: { name: string; type: 'docs'|'json'|'txt'; size: number; content?: string }, token: string) =>
    apiRequest<any>(`/files`, { method: 'POST', token, body: JSON.stringify(data) }),
  remove: (id: string, token: string) => apiRequest<void>(`/files/${id}`, { method: 'DELETE', token }),
};

export const AuthAPI = {
  forgot: (email: string) => apiRequest<{ resetToken: string; resetLink: string }>(`/auth/forgot`, { method: 'POST', body: JSON.stringify({ email }) }),
  reset: (token: string, newPassword: string) => apiRequest<void>(`/auth/reset`, { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
};

export type { };
