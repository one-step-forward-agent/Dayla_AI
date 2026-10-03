import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "./api/client";
import type { CalendarEvent, Integration, TelegramStatus, User } from "./api/types";

// Starting point only: shows that auth, events, integrations and Telegram status are wired.
// Replace with real pages/routing as the UI grows.
export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const loadUser = useCallback(async () => {
    try {
      setUser(await api.me.get());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else throw error;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (user === undefined) return <main className="page">Загрузка…</main>;
  return (
    <main className="page">
      <header>
        <h1>Focus Day</h1>
        {user && (
          <div className="session">
            {user.name ?? user.email}
            <button className="link" onClick={() => api.auth.logout().then(() => setUser(null))}>
              Выйти
            </button>
          </div>
        )}
      </header>
      {user ? <Dashboard /> : <AuthForm onDone={loadUser} />}
    </main>
  );
}

function AuthForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (mode: "login" | "register") => async (event?: FormEvent) => {
    event?.preventDefault();
    setError("");
    try {
      if (mode === "login") await api.auth.login(email, password);
      else await api.auth.register({ email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form className="card auth" onSubmit={submit("login")}>
      <h2>Вход</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Пароль (минимум 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <div className="actions">
        <button type="submit">Войти</button>
        <button type="button" className="secondary" onClick={() => submit("register")()}>
          Регистрация
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function Dashboard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);

  useEffect(() => {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86_400_000).toISOString();
    api.events.list({ start, end }).then(setEvents);
    api.integrations.list().then(setIntegrations);
    api.telegram.status().then(setTelegram);
  }, []);

  return (
    <div className="grid">
      <section className="card">
        <h2>Ближайшие события</h2>
        {events.length === 0 && <p className="muted">Событий на 30 дней нет.</p>}
        <ul className="list">
          {events.map((event) => (
            <li key={event.id}>
              <time>{new Date(event.start_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: event.all_day ? undefined : "short" })}</time>
              <span>{event.title}</span>
              <small className="muted">{event.source}</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>Интеграции</h2>
        <ul className="list">
          {integrations.map((item) => (
            <li key={item.slug}>
              <span>{item.title}</span>
              <small className={item.connection?.status === "connected" ? "ok" : "muted"}>
                {item.connection ? item.connection.status : "не подключено"}
              </small>
            </li>
          ))}
        </ul>
        <h2>Telegram</h2>
        <p className="muted">{telegram?.linked ? `Подключён @${telegram.username ?? ""}` : "Не подключён"}</p>
      </section>
    </div>
  );
}
