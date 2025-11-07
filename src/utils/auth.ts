const TOKEN_KEY = "auth_token";

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (_) {}
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (_) {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
