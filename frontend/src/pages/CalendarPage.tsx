import { useMemo } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { Button, Card, Empty, ErrorNote, PageHeader } from "../components/ui";
import {
  addDays,
  dayKey,
  formatDate,
  formatMonth,
  occursOn,
  parseDayKey,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_CHIPS = 3;

export function CalendarPage() {
  useTitle("Календарь");
  const { query } = useLocation();
  const today = startOfDay(new Date());
  const selected = parseDayKey(query.get("day")) ?? today;
  const month = parseDayKey(`${query.get("month") ?? ""}-01`) ?? startOfMonth(selected);

  // Always six weeks, so the grid height doesn't jump between months.
  const gridStart = startOfWeek(month);
  const days = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)), [gridStart.getTime()]);
  const gridEnd = addDays(gridStart, 42);

  const events = useAsync(
    () => api.events.list({ start: gridStart.toISOString(), end: gridEnd.toISOString(), limit: 1000 }),
    [gridStart.getTime()],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) map.set(dayKey(day), (events.data ?? []).filter((event) => occursOn(event, day)));
    return map;
  }, [days, events.data]);

  const go = (nextMonth: Date, day?: Date) => {
    const monthKey = dayKey(nextMonth).slice(0, 7);
    navigate(`/calendar?month=${monthKey}${day ? `&day=${dayKey(day)}` : ""}`, { replace: true });
  };
  const shiftMonth = (delta: number) => go(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const selectDay = (day: Date) => go(day.getMonth() === month.getMonth() ? month : startOfMonth(day), day);

  const selectedEvents = byDay.get(dayKey(selected)) ?? (events.data ?? []).filter((event) => occursOn(event, selected));

  return (
    <div className="page page-wide">
      <PageHeader
        title={formatMonth(month)}
        actions={
          <div className="segmented">
            <Button variant="ghost" icon="left" aria-label="Предыдущий месяц" onClick={() => shiftMonth(-1)} />
            <Button variant="ghost" size="sm" onClick={() => selectDay(today)}>
              Сегодня
            </Button>
            <Button variant="ghost" icon="right" aria-label="Следующий месяц" onClick={() => shiftMonth(1)} />
          </div>
        }
      />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      <div className="calendar-layout">
        <div className={`month ${events.loading ? "is-loading" : ""}`} role="grid" aria-label={formatMonth(month)}>
          <div className="month-head" role="row">
            {WEEKDAYS.map((name) => (
              <span key={name} role="columnheader">
                {name}
              </span>
            ))}
          </div>
          <div className="month-grid">
            {days.map((day) => {
              const items = byDay.get(dayKey(day)) ?? [];
              const classes = [
                "day-cell",
                day.getMonth() !== month.getMonth() && "other-month",
                sameDay(day, today) && "today",
                sameDay(day, selected) && "selected",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={day.getTime()}
                  type="button"
                  role="gridcell"
                  className={classes}
                  onClick={() => selectDay(day)}
                  aria-pressed={sameDay(day, selected)}
                  aria-label={`${formatDate(day, { day: "numeric", month: "long" })}, событий: ${items.length}`}
                >
                  <span className="day-number">{day.getDate()}</span>
                  <span className="day-chips">
                    {items.slice(0, MAX_CHIPS).map((event) => (
                      <span key={event.id} className={`chip priority-${event.priority}`}>
                        {!event.all_day && <b>{new Date(event.start_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</b>} {event.title}
                      </span>
                    ))}
                    {items.length > MAX_CHIPS && <span className="chip-more">+{items.length - MAX_CHIPS}</span>}
                  </span>
                  {items.length > 0 && (
                    <span className="day-dots" aria-hidden="true">
                      {items.slice(0, 3).map((event) => (
                        <i key={event.id} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Card
          className="day-panel"
          title={formatDate(selected, { weekday: "long", day: "numeric", month: "long" })}
          actions={
            <Link to={`/events/new?day=${dayKey(selected)}`} className="btn btn-primary btn-sm">
              <Icon name="plus" size={16} />
              Событие
            </Link>
          }
        >
          {selectedEvents.length ? (
            <EventList events={selectedEvents} />
          ) : (
            <Empty title="Нет событий">{events.loading ? "Загружаем…" : "Выберите другой день или добавьте событие."}</Empty>
          )}
        </Card>
      </div>
    </div>
  );
}
