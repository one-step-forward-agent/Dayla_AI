import type {
  CalendarEvent,
  EventCreate,
  Integration,
  IntegrationConnection,
  ReminderSettings,
  SyncResult,
  TelegramLink,
  TelegramStatus,
  TokenResponse,
  User,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Auth uses the backend's httpOnly cookies (same origin via the Vite/nginx proxy),
// so no token handling is needed here: on 401 we refresh once and retry.
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(path, { credentials: "same-origin", ...init });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await fetch("/auth/refresh", { method: "POST", credentials: "same-origin" });
    if (refreshed.ok) return request<T>(path, init, false);
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item: { msg: string }) => item.msg).join("; ")
      : data.detail;
    throw new ApiError(response.status, detail || response.statusText);
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string | null; timezone?: string }) =>
      request<TokenResponse>("/auth/register", json("POST", body)),
    login: (email: string, password: string) => request<TokenResponse>("/auth/login", json("POST", { email, password })),
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),
  },
  me: {
    get: () => request<User>("/api/me"),
    update: (body: { name?: string | null; timezone?: string }) => request<User>("/api/me", json("PATCH", body)),
  },
  events: {
    list: (params: { start?: string; end?: string; limit?: number } = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return request<CalendarEvent[]>(`/api/events?${query}`);
    },
    create: (body: EventCreate) => request<CalendarEvent>("/api/events", json("POST", body)),
    update: (id: number, body: Partial<EventCreate>) => request<CalendarEvent>(`/api/events/${id}`, json("PUT", body)),
    remove: (id: number) => request<void>(`/api/events/${id}`, { method: "DELETE" }),
  },
  integrations: {
    list: () => request<Integration[]>("/api/integrations"),
    // For OAuth providers (Google) the response is { authorization_url } to redirect to.
    connect: (slug: string, values: Record<string, unknown>) =>
      request<IntegrationConnection | { authorization_url: string }>(`/api/integrations/${slug}/connect`, json("POST", { values })),
    test: (slug: string) => request<{ status: string; account: string }>(`/api/integrations/${slug}/test`, { method: "POST" }),
    sync: (slug: string) => request<SyncResult>(`/api/integrations/${slug}/sync`, { method: "POST" }),
    exportEvent: (slug: string, eventId: number) => request<{ url: string | null }>(`/api/integrations/${slug}/export/${eventId}`, { method: "POST" }),
    disconnect: (slug: string, purge = false) => request<void>(`/api/integrations/${slug}?purge=${purge}`, { method: "DELETE" }),
  },
  reminders: {
    get: () => request<ReminderSettings>("/api/reminders/settings"),
    update: (body: Partial<ReminderSettings>) => request<ReminderSettings>("/api/reminders/settings", json("PUT", body)),
    test: () => request<{ id: number; status: string }>("/api/reminders/test", { method: "POST" }),
  },
  telegram: {
    status: () => request<TelegramStatus>("/api/telegram"),
    link: () => request<TelegramLink>("/api/telegram/link", { method: "POST" }),
    unlink: () => request<void>("/api/telegram", { method: "DELETE" }),
  },
};
