const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired — please log in again.');
  }

  const envelope = await response.json().catch(() => null);

  if (!response.ok || !envelope?.success) {
    const message = envelope?.error?.message || `Request failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  return envelope.data;
}
