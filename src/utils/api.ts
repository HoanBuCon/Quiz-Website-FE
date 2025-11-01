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
    apiRequest<any>(`/classes`, { method: 'POST', token, body: JSON.stringify({ isPublic: false, ...data }) }),
  update: (id: string, data: { name?: string; description?: string; isPublic?: boolean }, token: string) =>
    apiRequest<any>(`/classes/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  remove: (id: string, token: string) => apiRequest<void>(`/classes/${id}`, { method: 'DELETE', token }),
  import: (payload: { classId?: string; quizId?: string }, token: string) =>
    apiRequest<any>(`/classes/import`, { method: 'POST', token, body: JSON.stringify(payload) }),
};

export const QuizzesAPI = {
  getById: (quizId: string, token: string) => apiRequest<any>(`/quizzes/${quizId}`, { token }),
  byClass: (classId: string, token: string) => apiRequest<any[]>(`/quizzes/by-class/${classId}`, { token }),
  create: (data: any, token: string) => apiRequest<any>(`/quizzes`, { method: 'POST', token, body: JSON.stringify({ published: false, ...data }) }),
  update: (id: string, data: any, token: string) => apiRequest<any>(`/quizzes/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  remove: (id: string, token: string) => apiRequest<void>(`/quizzes/${id}`, { method: 'DELETE', token }),
};

export const VisibilityAPI = {
  publicToggle: async (
    payload: { targetType: 'class'|'quiz'; targetId: string; enabled: boolean },
    token: string
  ) => {
    // Prefer legacy-compatible update first to work with older backends (no /visibility route)
    try {
      if (payload.targetType === 'class') {
        await ClassesAPI.update(payload.targetId, { isPublic: payload.enabled }, token);
      } else {
        await QuizzesAPI.update(payload.targetId, { published: payload.enabled }, token);
      }
      return { ok: true, fallback: true } as any;
    } catch (_legacyErr) {
      // If legacy path fails (or not permitted), try the newer consolidated endpoint
      return await apiRequest<any>(`/visibility/public`, { method: 'POST', token, body: JSON.stringify(payload) });
    }
  },
  shareToggle: async (payload: { targetType: 'class'|'quiz'; targetId: string; enabled: boolean }, token: string) => {
    try {
      return await apiRequest<any>(`/visibility/share`, { method: 'POST', token, body: JSON.stringify(payload) });
    } catch (_e: any) {
      // Older backend without share endpoints: best-effort no-op so UI can still open Share modal
      return { ok: true, fallback: true } as any;
    }
  },
  claim: (payload: { classId?: string; quizId?: string; code?: string }, token: string) =>
    apiRequest<any>(`/visibility/claim`, { method: 'POST', token, body: JSON.stringify(payload) }),
  removeAccess: (payload: { classId?: string; quizId?: string }, token: string) =>
    apiRequest<void>(`/visibility/access`, { method: 'DELETE', token, body: JSON.stringify(payload) }),
  listSharedClasses: (token: string) => apiRequest<any[]>(`/visibility/shared/classes`, { token }),
  listSharedQuizzes: (token: string) => apiRequest<any[]>(`/visibility/shared/quizzes`, { token }),
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
