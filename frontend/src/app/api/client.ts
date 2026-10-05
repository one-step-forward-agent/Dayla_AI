import type {
  AssistantResponse,
  Calendar,
  CalendarEvent,
  EventCreate,
  EventFile,
  EventLink,
  Integration,
  IntegrationConnection,
  ProposedEvent,
  ReminderHistoryItem,
  ReminderSettings,
  SearchResponse,
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

let unauthorizedHandler: () => void = () => {};
export const onUnauthorized = (handler: () => void) => {
  unauthorizedHandler = handler;
};

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const response = await fetch(path, { credentials: "same-origin", ...init });
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (retry && (await refreshSession())) return send(path, init, false);
    unauthorizedHandler();
  }
  return response;
}

async function errorFrom(response: Response): Promise<ApiError> {
  const data = await response.json().catch(() => ({}));
  const detail = Array.isArray(data.detail)
    ? data.detail.map((item: { msg: string }) => item.msg).join("; ")
    : data.detail;
  return new ApiError(response.status, detail || response.statusText || "Ошибка запроса");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await send(path, init);
  if (!response.ok) throw await errorFrom(response);
  if (response.status === 204) return undefined as T;
  return (await response.json().catch(() => undefined)) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const upload = (field: string, file: Blob, filename?: string): RequestInit => {
  const form = new FormData();
  form.append(field, file, filename ?? (file instanceof File ? file.name : "upload"));
  return { method: "POST", body: form };
};

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string | null; timezone?: string }) =>
      request<TokenResponse>("/auth/register", json("POST", body)),
    login: (email: string, password: string) => request<TokenResponse>("/auth/login", json("POST", { email, password })),
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),
    logoutAll: () => request<{ status: string }>("/auth/logout-all", { method: "POST" }),
  },
  me: {
    get: () => request<User>("/api/me"),
    update: (body: { name?: string | null; timezone?: string }) => request<User>("/api/me", json("PATCH", body)),
  },
  calendars: {
    list: () => request<Calendar[]>("/api/calendars"),
    create: (body: { name: string; description?: string | null; timezone?: string }) =>
      request<Calendar>("/api/calendars", json("POST", { provider: "local", ...body })),
    exportIcs: async () => {
      const response = await send("/api/calendar/export.ics");
      if (!response.ok) throw await errorFrom(response);
      return response.blob();
    },
  },
  events: {
    list: (params: { start?: string; end?: string; limit?: number } = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return request<CalendarEvent[]>(`/api/events?${query}`);
    },
    get: (id: number) => request<CalendarEvent>(`/api/events/${id}`),
    create: (body: EventCreate) => request<CalendarEvent>("/api/events", json("POST", body)),
    update: (id: number, body: Partial<EventCreate>) => request<CalendarEvent>(`/api/events/${id}`, json("PUT", body)),
    remove: (id: number) => request<void>(`/api/events/${id}`, { method: "DELETE" }),
    syncGoogle: (id: number) => request<CalendarEvent>(`/api/events/${id}/sync/google`, { method: "POST" }),
    links: (id: number) => request<EventLink[]>(`/api/events/${id}/links`),
    files: (id: number) => request<EventFile[]>(`/api/events/${id}/files`),
    uploadFile: (id: number, file: File) => request<{ id: number; filename: string; size: number }>(`/api/events/${id}/files`, upload("file", file)),
  },
  files: {
    remove: (id: number) => request<void>(`/api/files/${id}`, { method: "DELETE" }),
    text: (id: number) => request<{ file_id: number; text: string }>(`/api/files/${id}/text`, { method: "POST" }),
  },
  assistant: {
    message: (text: string) => request<AssistantResponse>("/api/assistant/message", json("POST", { text, timezone: timezone() })),
    confirm: (events: ProposedEvent[]) => request<AssistantResponse>("/api/assistant/confirm", json("POST", { events, timezone: timezone() })),
    search: (text: string) => request<SearchResponse>("/api/assistant/search", json("POST", { text, timezone: timezone() })),
    transcribe: (audio: Blob) => request<{ text: string }>("/api/assistant/transcribe", upload("audio", audio, "voice.webm")),
    readFile: (file: File) => request<{ filename: string; text: string }>("/api/assistant/file", upload("file", file)),
  },
  integrations: {
    list: () => request<Integration[]>("/api/integrations"),
    connect: (slug: string, values: Record<string, unknown>, returnTo?: string) =>
      request<IntegrationConnection | { authorization_url: string }>(`/api/integrations/${slug}/connect`, json("POST", { values, return_to: returnTo })),
    test: (slug: string) => request<{ status: string; account: string }>(`/api/integrations/${slug}/test`, { method: "POST" }),
    sync: (slug: string) => request<SyncResult>(`/api/integrations/${slug}/sync`, { method: "POST" }),
    exportEvent: (slug: string, eventId: number) => request<EventLink>(`/api/integrations/${slug}/export/${eventId}`, { method: "POST" }),
    disconnect: (slug: string, purge = false) => request<void>(`/api/integrations/${slug}?purge=${purge}`, { method: "DELETE" }),
  },
  reminders: {
    get: () => request<ReminderSettings>("/api/reminders/settings"),
    update: (body: Partial<ReminderSettings>) => request<ReminderSettings>("/api/reminders/settings", json("PUT", body)),
    test: () => request<{ id: number; status: string }>("/api/reminders/test", { method: "POST" }),
    history: () => request<ReminderHistoryItem[]>("/api/reminders/history"),
  },
  telegram: {
    status: () => request<TelegramStatus>("/api/telegram"),
    link: () => request<TelegramLink>("/api/telegram/link", { method: "POST" }),
    unlink: () => request<void>("/api/telegram", { method: "DELETE" }),
  },
};
