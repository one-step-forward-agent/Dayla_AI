import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { Button, Field } from "../components/ui";
import { browserTimezone, errorText } from "../lib/format";
import { Link, navigate, useLocation, useTitle } from "../router";

/** Only same-app paths are accepted as ?next=, so the login page can't redirect elsewhere. */
function nextPath(query: URLSearchParams): string {
  const next = query.get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  useTitle(isLogin ? "Вход" : "Регистрация");
  const { reload } = useAuth();
  const { query } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await api.auth.login(email, password);
      else await api.auth.register({ email, password, name: name.trim() || null, timezone: browserTimezone() });
      await reload();
      navigate(nextPath(query), { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const otherQuery = query.get("next") ? `?next=${encodeURIComponent(query.get("next")!)}` : "";

  return (
    <div className="auth-page">
      <div className="auth-intro">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Focus Day
        </span>
        <h1>{isLogin ? "С возвращением" : "Спокойный план на каждый день"}</h1>
        <p className="muted">Календарь, ассистент и напоминания в Telegram — в одном месте.</p>
      </div>
      <form className="card auth-card form" onSubmit={submit}>
        <h2>{isLogin ? "Вход" : "Регистрация"}</h2>
        {!isLogin && (
          <Field label="Имя">
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} placeholder="Как к вам обращаться" />
          </Field>
        )}
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
        </Field>
        <Field label="Пароль" hint={isLogin ? undefined : "Минимум 8 символов"}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            maxLength={128}
            required
          />
        </Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" busy={busy} className="btn-block">
          {isLogin ? "Войти" : "Создать аккаунт"}
        </Button>
        <p className="muted center">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <Link to={`${isLogin ? "/register" : "/login"}${otherQuery}`}>{isLogin ? "Зарегистрироваться" : "Войти"}</Link>
        </p>
      </form>
    </div>
  );
}
