import type { CalendarEvent, Priority } from "../api/types";

const LOCALE = "ru-RU";

export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const MINUTE = 60_000;
export const DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(value: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const formatTime = (date: Date) => date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  date.toLocaleDateString(LOCALE, options);
export const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" }) : "—";
export const formatMonth = (date: Date) => {
  const text = date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }).replace(/\s*г\.$/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export const formatWeekday = (date: Date, style: "short" | "long" = "long") => date.toLocaleDateString(LOCALE, { weekday: style });

export function relativeDay(date: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  return formatDate(date, { weekday: "short", day: "numeric", month: "long" });
}

export function eventTimeRange(event: CalendarEvent): string {
  if (event.all_day) return "Весь день";
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  if (sameDay(start, end)) return `${formatTime(start)}–${formatTime(end)}`;
  return `${formatTime(start)} – ${formatDate(end, { day: "numeric", month: "short" })} ${formatTime(end)}`;
}

export function occursOn(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY;
  return new Date(event.start_at).getTime() < dayEnd && new Date(event.end_at).getTime() > dayStart;
}

export function formatLead(minutes: number): string {
  if (minutes === 0) return "в момент начала";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days && `${days} дн`, hours && `${hours} ч`, mins && `${mins} мин`].filter(Boolean).join(" ");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Обычный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочно" },
];

export const SOURCE_LABELS: Record<string, string> = {
  local: "Dayla",
  ai: "Ассистент",
  google: "Google",
  apple: "Apple",
  jira: "Jira",
  notion: "Notion",
  obsidian: "Obsidian",
};

export const stripTags = (text: string) =>
  text.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

export const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
