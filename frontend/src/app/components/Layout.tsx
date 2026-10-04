import { useEffect, type ReactNode } from "react";
import { useAuth } from "../auth";
import { Link, navigate, useLocation } from "../router";
import { Icon, type IconName } from "./icons";
import { ErrorBoundary, useToast } from "./ui";

const NAV: { to: string; label: string; short: string; icon: IconName }[] = [
  { to: "/", label: "Сегодня", short: "Сегодня", icon: "today" },
  { to: "/calendar", label: "Календарь", short: "Календарь", icon: "calendar" },
  { to: "/assistant", label: "Ассистент", short: "Ассистент", icon: "assistant" },
  { to: "/integrations", label: "Интеграции", short: "Сервисы", icon: "integrations" },
  { to: "/settings", label: "Настройки", short: "Настройки", icon: "settings" },
];

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`));

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { path, query } = useLocation();
  const toast = useToast();

  // The Google OAuth callback on the backend redirects to "/?connected=google".
  const connected = query.get("connected");
  useEffect(() => {
    if (connected === "google") {
      toast("Google Calendar подключён");
      navigate("/integrations", { replace: true });
    }
  }, [connected, toast]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Focus Day
        </Link>
        <Link to="/events/new" className="btn btn-primary btn-md new-event">
          <Icon name="plus" size={18} /> Новое событие
        </Link>
        <nav aria-label="Разделы">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={`nav-link ${isActive(item.to, path) ? "active" : ""}`} aria-current={isActive(item.to, path) ? "page" : undefined}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar" aria-hidden="true">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-text">
            <span className="truncate">{user?.name || "Без имени"}</span>
            <span className="truncate muted">{user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => logout()} aria-label="Выйти" title="Выйти">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Focus Day
        </Link>
        <Link to="/events/new" className="btn btn-primary btn-sm btn-icon" aria-label="Новое событие">
          <Icon name="plus" size={18} />
        </Link>
      </header>

      <main className="content" id="content">
        <ErrorBoundary key={path}>{children}</ErrorBoundary>
      </main>

      <nav className="tabbar" aria-label="Разделы">
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className={`tab ${isActive(item.to, path) ? "active" : ""}`} aria-current={isActive(item.to, path) ? "page" : undefined}>
            <Icon name={item.icon} size={22} />
            <span>{item.short}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
