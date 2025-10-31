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


