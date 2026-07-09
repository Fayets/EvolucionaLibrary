import type {
  ActionResult,
  AnalyticsData,
  HubData,
  ResourceInput,
  ToggleFavoriteResult,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getDiscordLoginUrl(): string {
  return `${API_URL}/auth/discord`;
}

export async function getHub(): Promise<HubData> {
  const res = await fetch(`${API_URL}/api/hub`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 401) {
    throw new ApiError('SESSION_REQUIRED', 401);
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<HubData>;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>('/api/analytics');
}

export async function createResource(input: ResourceInput): Promise<ActionResult> {
  return apiFetch<ActionResult>('/api/resources', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateResource(
  resourceId: string,
  input: ResourceInput
): Promise<ActionResult> {
  return apiFetch<ActionResult>(`/api/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  return apiFetch<ActionResult>(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  });
}

export async function toggleFavorite(resourceId: string): Promise<ToggleFavoriteResult> {
  return apiFetch<ToggleFavoriteResult>(`/api/favorites/${resourceId}/toggle`, {
    method: 'POST',
  });
}

export async function recordClick(resourceId: string): Promise<void> {
  try {
    await apiFetch<void>(`/api/clicks/${resourceId}`, { method: 'POST' });
  } catch {
    // fire-and-forget
  }
}

export async function signOut(): Promise<void> {
  await apiFetch<void>('/auth/logout', { method: 'POST' });
}

export { ApiError };
