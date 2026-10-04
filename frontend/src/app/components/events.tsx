import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Calendar, CalendarEvent, EventCreate, Priority } from "../api/types";
import { useAuth } from "../auth";
import {
  DAY,
  PRIORITIES,
  SOURCE_LABELS,
  addDays,
  browserTimezone,
  dayKey,
  errorText,
  formatLead,
  formatTime,
  parseDayKey,
  startOfDay,
  toLocalInput,
} from "../lib/format";
import { Link } from "../router";
import { Icon } from "./icons";
import { Badge, Button, Field, Switch } from "./ui";

export function EventRow({ event, showDate = false }: { event: CalendarEvent; showDate?: boolean }) {
  const start = new Date(event.start_at);
  return (
    <li>
      <Link to={`/events/${event.id}`} className={`event-row priority-${event.priority}`}>
        <span className="event-time">
          {showDate && <span className="event-date">{start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
          {event.all_day ? "весь день" : formatTime(start)}
        </span>
        <span className="event-main">
          <span className="event-title">{event.title}</span>
          {(event.location || event.source !== "local") && (
            <span className="event-meta">
              {event.location && (
                <span>
                  <Icon name="location" size={13} /> {event.location}
                </span>
              )}
              {event.source !== "local" && <span>{SOURCE_LABELS[event.source] ?? event.source}</span>}
            </span>
          )}
        </span>
        {(event.priority === "high" || event.priority === "urgent") && (
          <Badge tone={event.priority === "urgent" ? "bad" : "warn"}>{event.priority === "urgent" ? "срочно" : "важно"}</Badge>
        )}
      </Link>
    </li>
  );
}

export function EventList({ events, showDate }: { events: CalendarEvent[]; showDate?: boolean }) {
  return (
    <ul className="event-list">
      {events.map((event) => (
        <EventRow key={event.id} event={event} showDate={showDate} />
      ))}
    </ul>
  );
}

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440];

interface FormState {
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  calendarId: string;
  priority: Priority;
  location: string;
  description: string;
  reminder: string;
}

function initialState(event?: CalendarEvent, day?: string | null): FormState {
  if (event) {
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    return {
      title: event.title,
      allDay: event.all_day,
      start: event.all_day ? dayKey(start) : toLocalInput(start),
      end: event.all_day ? dayKey(new Date(end.getTime() - 1)) : toLocalInput(end),
      calendarId: String(event.calendar_id),
      priority: event.priority,
      location: event.location ?? "",
      description: event.description ?? "",
      reminder: event.reminder_minutes == null ? "" : String(event.reminder_minutes),
    };
  }
  const base = parseDayKey(day ?? null) ?? new Date();
  const now = new Date();
  const hour = day && !sameLocalDay(base, now) ? 10 : now.getHours() + 1;
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour);
  return {
    title: "",
    allDay: false,
    start: toLocalInput(start),
    end: toLocalInput(new Date(start.getTime() + 3_600_000)),
    calendarId: "",
    priority: "medium",
    location: "",
    description: "",
    reminder: "",
  };
}

const sameLocalDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

function toPayload(state: FormState, timezone: string): EventCreate {
  let start: Date;
  let end: Date;
  if (state.allDay) {
    start = parseDayKey(state.start) ?? startOfDay(new Date());
    const lastDay = parseDayKey(state.end) ?? start;
    end = addDays(lastDay < start ? start : lastDay, 1);
  } else {
    start = new Date(state.start);
    end = new Date(state.end);
  }
  return {
    title: state.title.trim(),
    all_day: state.allDay,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    timezone,
    priority: state.priority,
    location: state.location.trim() || null,
    description: state.description.trim() || null,
    reminder_minutes: state.reminder === "" ? null : Number(state.reminder),
  };
}

export function EventForm({
  event,
  day,
  calendars = [],
  onSaved,
  onCancel,
}: {
  event?: CalendarEvent;
  day?: string | null;
  calendars?: Calendar[];
  onSaved: (event: CalendarEvent) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState(() => initialState(event, day));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((current) => ({ ...current, [key]: value }));

  const changeStart = (value: string) => {
    setState((current) => {
      if (current.allDay) {
        const end = current.end < value ? value : current.end;
        return { ...current, start: value, end };
      }
      const duration = new Date(current.end).getTime() - new Date(current.start).getTime();
      const start = new Date(value);
      if (Number.isNaN(start.getTime())) return { ...current, start: value };
      return { ...current, start: value, end: toLocalInput(new Date(start.getTime() + Math.max(duration, 15 * 60_000))) };
    });
  };

  const toggleAllDay = (allDay: boolean) => {
    setState((current) => {
      const start = allDay ? current.start.slice(0, 10) : `${current.start.slice(0, 10)}T10:00`;
      const end = allDay ? current.end.slice(0, 10) : `${current.start.slice(0, 10)}T11:00`;
      return { ...current, allDay, start, end };
    });
  };

  const submit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const payload = toPayload(state, event?.timezone ?? user?.timezone ?? browserTimezone());
    if (!payload.title) return setError("Введите название");
    if (new Date(payload.end_at).getTime() <= new Date(payload.start_at).getTime()) return setError("Окончание должно быть позже начала");
    setError("");
    setSaving(true);
    try {
      const saved = event
        ? await api.events.update(event.id, payload)
        : await api.events.create({ ...payload, ...(state.calendarId ? { calendar_id: Number(state.calendarId) } : {}) });
      onSaved(saved);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const localCalendars = calendars.filter((calendar) => calendar.provider === "local");
  const durationDays = state.allDay
    ? Math.round(((parseDayKey(state.end)?.getTime() ?? 0) - (parseDayKey(state.start)?.getTime() ?? 0)) / DAY) + 1
    : 0;

  return (
    <form className="form" onSubmit={submit}>
      <Field label="Название">
        <input value={state.title} onChange={(e) => set("title", e.target.value)} placeholder="Встреча с командой" maxLength={300} autoFocus required />
      </Field>

      <Switch checked={state.allDay} onChange={toggleAllDay} label="Весь день" />

      <div className="form-row">
        <Field label="Начало">
          <input type={state.allDay ? "date" : "datetime-local"} value={state.start} onChange={(e) => changeStart(e.target.value)} required />
        </Field>
        <Field label={state.allDay ? "Последний день" : "Окончание"} hint={state.allDay && durationDays > 1 ? `${durationDays} дн.` : undefined}>
          <input type={state.allDay ? "date" : "datetime-local"} value={state.end} min={state.start} onChange={(e) => set("end", e.target.value)} required />
        </Field>
      </div>

      <div className="form-row">
        <Field label="Приоритет">
          <select value={state.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
            {PRIORITIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Напоминание">
          <select value={state.reminder} onChange={(e) => set("reminder", e.target.value)}>
            <option value="">По настройкам</option>
            {REMINDER_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes === 0 ? "В момент начала" : `За ${formatLead(minutes)}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!event && localCalendars.length > 1 && (
        <Field label="Календарь">
          <select value={state.calendarId} onChange={(e) => set("calendarId", e.target.value)}>
            <option value="">Основной</option>
            {localCalendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Место">
        <input value={state.location} onChange={(e) => set("location", e.target.value)} placeholder="Офис, ссылка на звонок…" maxLength={500} />
      </Field>

      <Field label="Описание">
        <textarea value={state.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Заметки, повестка" />
      </Field>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" variant="primary" busy={saving} icon="check">
          {event ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
