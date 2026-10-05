import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { ReminderSettings, Source, TelegramLink } from "../api/types";
import { ThemePicker } from "@/theme";
import { useAuth, useSignOut, useUser } from "../auth";
import { Icon } from "../components/icons";
import { Badge, Button, Card, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Switch, useErrorToast, useToast } from "../components/ui";
import { SOURCE_LABELS, browserTimezone, errorText, formatDateTime, formatLead, stripTags } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { useTitle } from "../router";

const SECTIONS = [
  { id: "profile", label: "Профиль" },
  { id: "appearance", label: "Оформление" },
  { id: "reminders", label: "Напоминания" },
  { id: "telegram", label: "Telegram" },
  { id: "calendars", label: "Календари" },
  { id: "security", label: "Безопасность" },
];

export function SettingsPage() {
  useTitle("Настройки");

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="page page-narrow">
      <PageHeader title="Настройки" />
      <nav className="section-nav" aria-label="Разделы настроек">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.label}
          </a>
        ))}
      </nav>
      <ProfileSection />
      <AppearanceSection />
      <RemindersSection />
      <TelegramSection />
      <CalendarsSection />
      <SecuritySection />
    </div>
  );
}

function ProfileSection() {
  const user = useUser();
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name ?? "");
  const [timezone, setTimezone] = useState(user.timezone ?? browserTimezone());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const reportError = useErrorToast();
  const zones = useMemo(() => {
    const list = Intl.supportedValuesOf("timeZone");
    return list.includes(timezone) ? list : [timezone, ...list];
  }, [timezone]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      setUser(await api.me.update({ name: name.trim() || null, timezone }));
      toast("Профиль сохранён");
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="profile" className="anchor">
      <Card title="Профиль">
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <Field label="Имя">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} autoComplete="name" />
            </Field>
            <Field label="Email">
              <input value={user.email} disabled />
            </Field>
          </div>
          <Field label="Часовой пояс" hint={timezone !== browserTimezone() ? `На этом устройстве: ${browserTimezone()}` : "Совпадает с этим устройством"}>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-actions">
            <Button type="submit" variant="primary" busy={busy}>
              Сохранить
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div id="appearance" className="anchor">
      <Card title="Оформление">
        <p className="muted small">Тема сохраняется в этом браузере и действует на всём сайте.</p>
        <div style={{ marginTop: 12 }}>
          <ThemePicker />
        </div>
      </Card>
    </div>
  );
}

const LEAD_PRESETS = [0, 5, 10, 15, 30, 60, 120, 1440];
const SOURCES: Source[] = ["local", "ai", "google", "apple", "jira", "notion", "obsidian"];

function RemindersSection() {
  const settings = useAsync(() => api.reminders.get(), []);
  const [draft, setDraft] = useState<ReminderSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const reportError = useErrorToast();

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const update = (patch: Partial<ReminderSettings>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await api.reminders.update({
        ...draft,
        lead_times: [...draft.lead_times].sort((a, b) => a - b),
        daily_digest_time: draft.daily_digest_time.slice(0, 5),
        quiet_hours_start: draft.quiet_hours_start.slice(0, 5),
        quiet_hours_end: draft.quiet_hours_end.slice(0, 5),
      });
      settings.setData(saved);
      toast("Настройки напоминаний сохранены");
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const dirty = draft && settings.data && JSON.stringify(draft) !== JSON.stringify(settings.data);

  return (
    <div id="reminders" className="anchor">
      <Card title="Напоминания">
        {settings.error && <ErrorNote message={settings.error} onRetry={settings.reload} />}
        {!draft ? (
          settings.loading && <Loading />
        ) : (
          <div className="form">
            <Switch checked={draft.enabled} onChange={(enabled) => update({ enabled })} label="Напоминать о событиях" hint="Сообщения приходят в Telegram-бота" />

            <fieldset className="fieldset" disabled={!draft.enabled}>
              <legend className="field-label">Когда напоминать</legend>
              <div className="chips">
                {LEAD_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`chip-toggle ${draft.lead_times.includes(minutes) ? "active" : ""}`}
                    aria-pressed={draft.lead_times.includes(minutes)}
                    onClick={() => update({ lead_times: toggle(draft.lead_times, minutes).slice(0, 10) })}
                  >
                    {minutes === 0 ? "в момент начала" : `за ${formatLead(minutes)}`}
                  </button>
                ))}
              </div>
              <span className="field-hint">Для отдельного события можно задать своё время в его настройках.</span>
            </fieldset>

            <Switch checked={draft.daily_digest_enabled} onChange={(value) => update({ daily_digest_enabled: value })} label="План дня по утрам" />
            {draft.daily_digest_enabled && (
              <Field label="Время плана" className="field-inline">
                <input type="time" value={draft.daily_digest_time.slice(0, 5)} onChange={(e) => update({ daily_digest_time: e.target.value })} />
              </Field>
            )}

            <Switch checked={draft.quiet_hours_enabled} onChange={(value) => update({ quiet_hours_enabled: value })} label="Тихие часы" hint="Ничего не присылать в это время" />
            {draft.quiet_hours_enabled && (
              <div className="form-row">
                <Field label="С">
                  <input type="time" value={draft.quiet_hours_start.slice(0, 5)} onChange={(e) => update({ quiet_hours_start: e.target.value })} />
                </Field>
                <Field label="До">
                  <input type="time" value={draft.quiet_hours_end.slice(0, 5)} onChange={(e) => update({ quiet_hours_end: e.target.value })} />
                </Field>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="field-label">Источники</legend>
              <div className="chips">
                {SOURCES.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={`chip-toggle ${draft.sources.includes(source) ? "active" : ""}`}
                    aria-pressed={draft.sources.includes(source)}
                    onClick={() => update({ sources: toggle(draft.sources, source) })}
                  >
                    {SOURCE_LABELS[source]}
                  </button>
                ))}
              </div>
              <span className="field-hint">{draft.sources.length ? "Напоминания только для выбранных источников." : "Ничего не выбрано — напоминания для всех событий."}</span>
            </fieldset>

            <div className="form-actions">
              <Button variant="primary" busy={busy} disabled={!dirty} onClick={save}>
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function TelegramSection() {
  const status = useAsync(() => api.telegram.status(), []);
  const history = useAsync(() => api.reminders.history(), []);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const { reload: reloadUser } = useAuth();

  const copy = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Скопировано"))
      .catch(() => toast("Не удалось скопировать", "error"));

  return (
    <div id="telegram" className="anchor">
      <Card title="Telegram">
        {status.error && <ErrorNote message={status.error} onRetry={status.reload} />}
        {!status.data ? (
          status.loading && <Loading />
        ) : status.data.linked ? (
          <div className="form">
            <p>
              <Badge tone="ok">подключён</Badge> {status.data.username ? `@${status.data.username}` : "чат привязан"}
              <span className="muted"> · с {formatDateTime(status.data.linked_at)}</span>
            </p>
            <p className="muted small">Пишите боту планы обычными словами, голосом или файлом PDF/DOCX — события появятся в календаре. Спросите «что у меня завтра?», чтобы увидеть план.</p>
            <div className="button-row">
              <Button
                icon="bell"
                busy={pending === "test"}
                onClick={() =>
                  run("test", async () => {
                    await api.reminders.test();
                    toast("Тестовое уведомление отправлено");
                    window.setTimeout(history.reload, 3000);
                  })
                }
              >
                Отправить тест
              </Button>
              <ConfirmButton
                confirmLabel="Отвязать?"
                busy={pending === "unlink"}
                onConfirm={() =>
                  run("unlink", async () => {
                    await api.telegram.unlink();
                    await Promise.all([status.reload(), reloadUser()]);
                  })
                }
              >
                Отвязать
              </ConfirmButton>
            </div>
          </div>
        ) : (
          <div className="form">
            <p className="muted">Привяжите Telegram, чтобы планировать в чате с Dayla: пишите или надиктовывайте планы, спрашивайте о расписании и получайте напоминания и план на утро.</p>
            {link ? (
              <div className="link-code">
                {link.deep_link && (
                  <a className="btn btn-primary btn-md" href={link.deep_link} target="_blank" rel="noreferrer noopener">
                    Открыть бота <Icon name="external" size={16} />
                  </a>
                )}
                <p className="small">
                  {link.deep_link ? "Или отправьте боту команду:" : "Отправьте боту команду:"}
                </p>
                <button type="button" className="code" onClick={() => copy(`/start ${link.code}`)} title="Скопировать">
                  /start {link.code}
                </button>
                <p className="muted small">Код действует до {new Date(link.expires_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}.</p>
                <Button size="sm" variant="ghost" icon="sync" busy={status.loading} onClick={status.reload}>
                  Я отправил — проверить
                </Button>
              </div>
            ) : (
              <Button variant="primary" busy={pending === "link"} onClick={() => run("link", async () => setLink(await api.telegram.link()))}>
                Подключить Telegram
              </Button>
            )}
          </div>
        )}

        {history.data && history.data.length > 0 && (
          <details className="history">
            <summary>Последние уведомления</summary>
            <ul>
              {history.data.map((item) => (
                <li key={item.id}>
                  <span className="history-text">{stripTags(item.text)}</span>
                  <span className="muted small">
                    {formatDateTime(item.sent_at ?? item.scheduled_for)} ·{" "}
                    <Badge tone={item.status === "sent" ? "ok" : item.status === "failed" ? "bad" : "neutral"}>{item.status}</Badge>
                    {item.error ? ` ${item.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
}

function CalendarsSection() {
  const calendars = useAsync(() => api.calendars.list(), []);
  const [name, setName] = useState("");
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());

  const create = (event: FormEvent) => {
    event.preventDefault();
    run("create", async () => {
      await api.calendars.create({ name: name.trim(), timezone: browserTimezone() });
      setName("");
      await calendars.reload();
      toast("Календарь создан");
    });
  };

  const exportIcs = () =>
    run("export", async () => {
      const blob = await api.calendars.exportIcs();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "focus-day.ics";
      anchor.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div id="calendars" className="anchor">
      <Card
        title="Календари"
        actions={
          <Button size="sm" variant="ghost" icon="download" busy={pending === "export"} onClick={exportIcs}>
            Экспорт .ics
          </Button>
        }
      >
        {calendars.error && <ErrorNote message={calendars.error} onRetry={calendars.reload} />}
        {calendars.data && (
          <ul className="simple-list">
            {calendars.data.map((calendar) => (
              <li key={calendar.id}>
                <span className="truncate">{calendar.name}</span>
                <Badge>{SOURCE_LABELS[calendar.provider] ?? calendar.provider}</Badge>
              </li>
            ))}
          </ul>
        )}
        <form className="inline-form" onSubmit={create}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Новый календарь, например «Учёба»" maxLength={200} aria-label="Название календаря" />
          <Button type="submit" icon="plus" busy={pending === "create"} disabled={!name.trim()}>
            Создать
          </Button>
        </form>
      </Card>
    </div>
  );
}

function SecuritySection() {
  const logout = useSignOut();
  return (
    <div id="security" className="anchor">
      <Card title="Безопасность">
        <p className="muted small">«Выйти везде» завершает сеансы на всех устройствах, включая этот.</p>
        <div className="button-row">
          <Button icon="logout" onClick={() => logout()}>
            Выйти
          </Button>
          <ConfirmButton confirmLabel="Выйти на всех устройствах?" onConfirm={() => logout(true)}>
            Выйти везде
          </ConfirmButton>
        </div>
      </Card>
    </div>
  );
}
