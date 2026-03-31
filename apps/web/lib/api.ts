const API_BASE = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}/internal${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return api<T>(path, { method: 'DELETE' });
}
