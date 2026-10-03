// Mirrors backend/app/schemas.py. Keep in sync when the API changes.

export interface User {
  id: number;
  email: string;
  name: string | null;
  timezone: string | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type Source = "local" | "ai" | "google" | "apple" | "jira" | "notion" | "obsidian";

export interface CalendarEvent {
  id: number;
  calendar_id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  priority: Priority;
  location: string | null;
  all_day: boolean;
  reminder_minutes: number | null;
  status: string;
  source: Source | string;
  sync_status: string;
  external_id: string | null;
}

export interface EventCreate {
  title: string;
  start_at: string;
  end_at: string;
  calendar_id?: number;
  description?: string | null;
  timezone?: string;
  priority?: Priority;
  location?: string | null;
  all_day?: boolean;
  reminder_minutes?: number | null;
}

export interface IntegrationField {
  name: string;
  label: string;
  type: "text" | "password" | "url" | "checkbox";
  secret: boolean;
  required: boolean;
  placeholder: string;
  default: unknown;
  help: string;
}

export interface IntegrationConnection {
  id: number;
  provider: string;
  account_email: string | null;
  status: "connected" | "error" | string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  config: Record<string, unknown>;
}

export interface Integration {
  slug: string;
  title: string;
  description: string;
  auth_type: "oauth" | "credentials";
  supports_push: boolean;
  fields: IntegrationField[];
  connection: IntegrationConnection | null;
}

export interface SyncResult {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}

export interface ReminderSettings {
  enabled: boolean;
  lead_times: number[];
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  sources: Source[];
}

export interface TelegramStatus {
  linked: boolean;
  username: string | null;
  linked_at: string | null;
  bot_username: string | null;
}

export interface TelegramLink {
  code: string;
  expires_at: string;
  deep_link: string | null;
}
