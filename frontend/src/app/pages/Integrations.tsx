import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Integration } from "../api/types";
import { Badge, Button, Card, ConfirmButton, Dialog, ErrorNote, Field, Loading, PageHeader, Switch, useErrorToast, useToast } from "../components/ui";
import { errorText, formatDateTime } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { useTitle } from "../router";

export function IntegrationsPage() {
  useTitle("Интеграции");
  const integrations = useAsync(() => api.integrations.list(), []);
  const [editing, setEditing] = useState<Integration | null>(null);

  return (
    <div className="page">
      <PageHeader title="Интеграции" subtitle="Импортируйте события и задачи из сервисов и отправляйте события Focus Day обратно." />
      {integrations.error && <ErrorNote message={integrations.error} onRetry={integrations.reload} />}
      {!integrations.data ? (
        integrations.loading && <Loading />
      ) : (
        <div className="grid-cards">
          {integrations.data.map((item) => (
            <IntegrationCard key={item.slug} item={item} onEdit={() => setEditing(item)} onChanged={integrations.reload} />
          ))}
        </div>
      )}
      <Dialog open={editing !== null} title={editing ? `${editing.title}: подключение` : ""} onClose={() => setEditing(null)}>
        {editing && (
          <ConnectForm
            item={editing}
            onDone={() => {
              setEditing(null);
              integrations.reload();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function IntegrationCard({ item, onEdit, onChanged }: { item: Integration; onEdit: () => void; onChanged: () => void }) {
  const connection = item.connection;
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const [purge, setPurge] = useState(false);

  const connectOAuth = () =>
    run("connect", async () => {
      const result = await api.integrations.connect(item.slug, {});
      if ("authorization_url" in result) window.location.assign(result.authorization_url);
    });

  const status = !connection ? (
    <Badge>не подключено</Badge>
  ) : connection.status === "connected" ? (
    <Badge tone="ok">подключено</Badge>
  ) : (
    <Badge tone="bad">ошибка</Badge>
  );

  return (
    <Card className="integration">
      <div className="integration-head">
        <span className={`integration-logo logo-${item.slug}`} aria-hidden="true">
          {item.title.charAt(0)}
        </span>
        <div>
          <h2>{item.title}</h2>
          {status}
        </div>
      </div>
      <p className="muted small">{item.description}</p>

      {connection && (
        <dl className="integration-meta">
          {connection.account_email && (
            <div>
              <dt>Аккаунт</dt>
              <dd className="truncate">{connection.account_email}</dd>
            </div>
          )}
          <div>
            <dt>Синхронизация</dt>
            <dd>{connection.last_sync_at ? formatDateTime(connection.last_sync_at) : "ещё не было"}</dd>
          </div>
        </dl>
      )}
      {connection?.last_sync_error && <p className="form-error small">{connection.last_sync_error}</p>}

      <div className="button-row">
        {!connection ? (
          <Button variant="primary" size="sm" busy={pending === "connect"} onClick={item.auth_type === "oauth" ? connectOAuth : onEdit}>
            Подключить
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              icon="sync"
              busy={pending === "sync"}
              onClick={() =>
                run("sync", async () => {
                  const result = await api.integrations.sync(item.slug);
                  toast(`Получено ${result.fetched}: новых ${result.created}, обновлено ${result.updated}`);
                  onChanged();
                })
              }
            >
              Синхронизировать
            </Button>
            <Button
              size="sm"
              variant="ghost"
              busy={pending === "test"}
              onClick={() =>
                run("test", async () => {
                  const result = await api.integrations.test(item.slug);
                  toast(`Работает: ${result.account}`);
                  onChanged();
                })
              }
            >
              Проверить
            </Button>
            {item.auth_type === "oauth" ? (
              <Button size="sm" variant="ghost" busy={pending === "connect"} onClick={connectOAuth}>
                Переподключить
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Настройки
              </Button>
            )}
          </>
        )}
      </div>

      {connection && (
        <div className="disconnect">
          <label className="check small">
            <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} />
            удалить импортированные события
          </label>
          <ConfirmButton
            size="sm"
            confirmLabel="Отключить?"
            busy={pending === "disconnect"}
            onConfirm={() =>
              run("disconnect", async () => {
                await api.integrations.disconnect(item.slug, purge);
                toast(`${item.title} отключён`);
                onChanged();
              })
            }
          >
            Отключить
          </ConfirmButton>
        </div>
      )}
    </Card>
  );
}

function ConnectForm({ item, onDone }: { item: Integration; onDone: () => void }) {
  const config = item.connection?.config ?? {};
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(item.fields.map((field) => [field.name, field.secret ? "" : config[field.name] ?? field.default ?? (field.type === "checkbox" ? false : "")])),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.integrations.connect(item.slug, values);
      toast(`${item.title} подключён`);
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <p className="muted small">{item.description}</p>
      {item.fields.map((field) =>
        field.type === "checkbox" ? (
          <Switch
            key={field.name}
            label={field.label}
            hint={field.help}
            checked={Boolean(values[field.name])}
            onChange={(checked) => setValues((current) => ({ ...current, [field.name]: checked }))}
          />
        ) : (
          <Field key={field.name} label={field.label + (field.required ? "" : " (необязательно)")} hint={field.help || undefined}>
            <input
              type={field.type === "password" ? "password" : field.type === "url" ? "url" : "text"}
              value={String(values[field.name] ?? "")}
              placeholder={field.secret && item.connection ? "Сохранено — оставьте пустым, чтобы не менять" : field.placeholder}
              required={field.required && !(field.secret && item.connection)}
              autoComplete={field.secret ? "new-password" : "off"}
              onChange={(e) => setValues((current) => ({ ...current, [field.name]: e.target.value }))}
            />
          </Field>
        ),
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <Button type="submit" variant="primary" busy={busy} icon="check">
          {item.connection ? "Сохранить" : "Подключить"}
        </Button>
      </div>
    </form>
  );
}
