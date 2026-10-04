import { useRef, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, EventFile, Integration } from "../api/types";
import { EventForm } from "../components/events";
import { Icon } from "../components/icons";
import { Badge, Button, Card, ConfirmButton, Dialog, ErrorNote, Loading, PageHeader, useErrorToast, useToast } from "../components/ui";
import { PRIORITIES, SOURCE_LABELS, dayKey, eventTimeRange, formatDate, formatLead, formatSize } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";

const FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export function NewEventPage() {
  useTitle("Новое событие");
  const { query } = useLocation();
  const calendars = useAsync(() => api.calendars.list(), []);
  const toast = useToast();
  return (
    <div className="page page-narrow">
      <PageHeader title="Новое событие" />
      <Card>
        <EventForm
          day={query.get("day")}
          calendars={calendars.data}
          onSaved={(event) => {
            toast("Событие создано");
            navigate(`/events/${event.id}`, { replace: true });
          }}
          onCancel={() => window.history.back()}
        />
      </Card>
    </div>
  );
}

export function EventPage({ id }: { id: number }) {
  const event = useAsync(() => api.events.get(id), [id]);
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  useTitle(event.data?.title ?? "Событие");

  if (event.error) {
    return (
      <div className="page page-narrow">
        <ErrorNote message={event.error} onRetry={event.reload} />
        <Link to="/calendar">← К календарю</Link>
      </div>
    );
  }
  if (!event.data) return <Loading />;
  const item = event.data;

  const remove = () =>
    run("delete", async () => {
      await api.events.remove(item.id);
      toast("Событие удалено");
      navigate("/calendar", { replace: true });
    });

  if (editing) {
    return (
      <div className="page page-narrow">
        <PageHeader title="Редактирование" />
        <Card>
          <EventForm
            event={item}
            onSaved={(saved) => {
              event.setData(saved);
              setEditing(false);
              toast("Сохранено");
            }}
            onCancel={() => setEditing(false)}
          />
        </Card>
      </div>
    );
  }

  const start = new Date(item.start_at);
  const priority = PRIORITIES.find((entry) => entry.value === item.priority);

  return (
    <div className="page page-narrow">
      <Link to={`/calendar?day=${dayKey(start)}`} className="back-link">
        <Icon name="left" size={16} /> Календарь
      </Link>
      <PageHeader
        title={item.title}
        actions={
          <>
            <Button icon="settings" onClick={() => setEditing(true)}>
              Изменить
            </Button>
            <ConfirmButton icon="trash" confirmLabel="Удалить?" busy={pending === "delete"} onConfirm={remove}>
              Удалить
            </ConfirmButton>
          </>
        }
      />

      <Card>
        <dl className="details">
          <div>
            <dt>
              <Icon name="calendar" size={16} /> Когда
            </dt>
            <dd>
              {formatDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              <br />
              <span className="muted">{eventTimeRange(item)}</span>
            </dd>
          </div>
          {item.location && (
            <div>
              <dt>
                <Icon name="location" size={16} /> Где
              </dt>
              <dd>{item.location}</dd>
            </div>
          )}
          <div>
            <dt>
              <Icon name="bell" size={16} /> Напоминание
            </dt>
            <dd>{item.reminder_minutes == null ? "По настройкам" : item.reminder_minutes === 0 ? "В момент начала" : `За ${formatLead(item.reminder_minutes)}`}</dd>
          </div>
          <div>
            <dt>Детали</dt>
            <dd className="badges">
              <Badge tone={item.priority === "urgent" ? "bad" : item.priority === "high" ? "warn" : "neutral"}>{priority?.label ?? item.priority}</Badge>
              <Badge>{SOURCE_LABELS[item.source] ?? item.source}</Badge>
              {item.sync_status === "synced" && <Badge tone="ok">синхронизировано</Badge>}
              {item.sync_status === "error" && <Badge tone="bad">ошибка синхронизации</Badge>}
            </dd>
          </div>
        </dl>
        {item.description && <p className="description">{item.description}</p>}
      </Card>

      <EventFiles eventId={item.id} />
      <EventExport event={item} onChange={event.setData} />
    </div>
  );
}

function EventFiles({ eventId }: { eventId: number }) {
  const files = useAsync(() => api.events.files(eventId), [eventId]);
  const input = useRef<HTMLInputElement>(null);
  const { pending, run } = useAction(useErrorToast());
  const [preview, setPreview] = useState<{ name: string; text: string } | null>(null);

  const uploadFiles = (list: FileList | null) =>
    run("upload", async () => {
      for (const file of Array.from(list ?? [])) await api.events.uploadFile(eventId, file);
      await files.reload();
    }).finally(() => {
      if (input.current) input.current.value = "";
    });

  const showText = (file: EventFile) =>
    run(`text-${file.id}`, async () => {
      const result = await api.files.text(file.id);
      setPreview({ name: file.filename, text: result.text || "Текст не найден." });
    });

  return (
    <Card
      title="Файлы"
      actions={
        <>
          <input ref={input} type="file" accept={FILE_TYPES} multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
          <Button size="sm" variant="ghost" icon="clip" busy={pending === "upload"} onClick={() => input.current?.click()}>
            Прикрепить
          </Button>
        </>
      }
    >
      {files.error && <ErrorNote message={files.error} onRetry={files.reload} />}
      {files.data?.length ? (
        <ul className="file-list">
          {files.data.map((file) => (
            <li key={file.id}>
              <Icon name="file" size={18} />
              <span className="truncate">{file.filename}</span>
              <span className="muted">{formatSize(file.size)}</span>
              {/\.(pdf|docx)$/i.test(file.filename) && (
                <Button size="sm" variant="ghost" busy={pending === `text-${file.id}`} onClick={() => showText(file)}>
                  Текст
                </Button>
              )}
              <ConfirmButton
                size="sm"
                icon="trash"
                confirmLabel="Удалить?"
                busy={pending === `delete-${file.id}`}
                onConfirm={() =>
                  run(`delete-${file.id}`, async () => {
                    await api.files.remove(file.id);
                    await files.reload();
                  })
                }
                label="Удалить файл"
              />
            </li>
          ))}
        </ul>
      ) : (
        !files.loading && <p className="muted">PDF, Word, Excel или изображения — до 20 МБ.</p>
      )}
      <Dialog open={preview !== null} title={preview?.name ?? ""} onClose={() => setPreview(null)}>
        <pre className="text-preview">{preview?.text}</pre>
      </Dialog>
    </Card>
  );
}

function EventExport({ event, onChange }: { event: CalendarEvent; onChange: (event: CalendarEvent) => void }) {
  const integrations = useAsync(() => api.integrations.list(), []);
  const links = useAsync(() => api.events.links(event.id), [event.id]);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());

  const connected = (integrations.data ?? []).filter((item) => item.connection);
  const google = connected.find((item) => item.slug === "google");
  const targets = connected.filter(
    (item: Integration) => item.supports_push && item.slug !== "google" && item.slug !== event.source && !links.data?.some((link) => link.provider === item.slug),
  );

  if (!connected.length && !links.data?.length) return null;

  return (
    <Card title="Отправить в сервисы">
      {links.data && links.data.length > 0 && (
        <ul className="link-list">
          {links.data.map((link) => (
            <li key={link.id}>
              <Badge tone="ok">{SOURCE_LABELS[link.provider] ?? link.provider}</Badge>
              {link.url ? (
                <a href={link.url} target="_blank" rel="noreferrer noopener">
                  Открыть <Icon name="external" size={14} />
                </a>
              ) : (
                <span className="muted">экспортировано</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="button-row">
        {google && event.source !== "google" && (
          <Button
            icon="sync"
            busy={pending === "google"}
            onClick={() =>
              run("google", async () => {
                onChange(await api.events.syncGoogle(event.id));
                toast("Отправлено в Google Calendar");
              })
            }
          >
            {event.sync_status === "synced" ? "Обновить в Google" : "Google Calendar"}
          </Button>
        )}
        {targets.map((item) => (
          <Button
            key={item.slug}
            icon="external"
            busy={pending === item.slug}
            onClick={() =>
              run(item.slug, async () => {
                await api.integrations.exportEvent(item.slug, event.id);
                await links.reload();
                toast(`Отправлено в ${item.title}`);
              })
            }
          >
            {item.title}
          </Button>
        ))}
      </div>
    </Card>
  );
}
