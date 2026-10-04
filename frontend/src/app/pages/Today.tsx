import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { useUser } from "../auth";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader } from "../components/ui";
import { addDays, dayKey, eventTimeRange, formatDate, formatWeekday, occursOn, relativeDay, startOfDay } from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Link, navigate, useTitle } from "../router";

function greeting(hour: number) {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export function TodayPage() {
  useTitle("Сегодня");
  const user = useUser();
  const now = new Date();
  const today = startOfDay(now);
  const events = useAsync(
    () => api.events.list({ start: today.toISOString(), end: addDays(today, 8).toISOString(), limit: 500 }),
    [today.getTime()],
  );
  const telegram = useAsync(() => api.telegram.status(), []);

  const todays = (events.data ?? []).filter((event) => occursOn(event, today));
  const next = todays.find((event) => !event.all_day && new Date(event.end_at) > now) ?? null;
  const upcoming = groupByDay((events.data ?? []).filter((event) => new Date(event.start_at) >= addDays(today, 1)));

  return (
    <div className="page">
      <PageHeader
        title={`${greeting(now.getHours())}${user.name ? `, ${user.name}` : ""}`}
        subtitle={formatDate(now, { weekday: "long", day: "numeric", month: "long" })}
      />

      <QuickAsk />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      <div className="grid-2">
        <Card title="Сегодня" actions={<Link to={`/events/new?day=${dayKey(today)}`} className="btn btn-ghost btn-sm"><Icon name="plus" size={16} />Добавить</Link>}>
          {events.loading && !events.data ? (
            <Loading />
          ) : todays.length ? (
            <>
              {next && <NextUp event={next} now={now} />}
              <EventList events={todays} />
            </>
          ) : (
            <Empty icon="today" title="На сегодня ничего">
              Свободный день — или самое время что-нибудь запланировать.
            </Empty>
          )}
        </Card>

        <div className="stack">
          <Card title="Неделя вперёд" actions={<Link to="/calendar" className="btn btn-ghost btn-sm">Календарь</Link>}>
            {events.loading && !events.data ? (
              <Loading />
            ) : upcoming.length ? (
              upcoming.map(([key, items]) => (
                <div key={key} className="day-group">
                  <h3>
                    {relativeDay(new Date(items[0].start_at), now)}
                    {relativeDay(new Date(items[0].start_at), now) === "Завтра" && (
                      <span className="muted"> · {formatWeekday(new Date(items[0].start_at))}</span>
                    )}
                  </h3>
                  <EventList events={items} />
                </div>
              ))
            ) : (
              <p className="muted">На ближайшую неделю событий нет.</p>
            )}
          </Card>

          {telegram.data && !telegram.data.linked && (
            <Card className="card-accent">
              <div className="hint-card">
                <Icon name="bell" size={22} />
                <div>
                  <strong>Напоминания в Telegram</strong>
                  <p className="muted">Подключите бота, чтобы получать напоминания и утренний план дня.</p>
                </div>
                <Link to="/settings#telegram" className="btn btn-secondary btn-sm">Подключить</Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NextUp({ event, now }: { event: CalendarEvent; now: Date }) {
  const start = new Date(event.start_at);
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  const label = minutes <= 0 ? "Идёт сейчас" : minutes < 60 ? `Через ${minutes} мин` : `Через ${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
  return (
    <Link to={`/events/${event.id}`} className="next-up">
      <span className="next-up-label">{label}</span>
      <span className="next-up-title">{event.title}</span>
      <span className="muted">
        {eventTimeRange(event)}
        {event.location ? ` · ${event.location}` : ""}
      </span>
    </Link>
  );
}

function groupByDay(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(new Date(event.start_at));
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()];
}

/** One-line entry into the assistant: "встреча с Олей завтра в 15:00". */
function QuickAsk() {
  const [text, setText] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) navigate(`/assistant?q=${encodeURIComponent(text.trim())}`);
  };
  return (
    <form className="quick-ask" onSubmit={submit}>
      <Icon name="assistant" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Напишите, что запланировать: «созвон с Олей завтра в 15:00»"
        aria-label="Запрос ассистенту"
      />
      <Button type="submit" variant="primary" size="sm" icon="send" aria-label="Отправить" disabled={!text.trim()} />
    </form>
  );
}
