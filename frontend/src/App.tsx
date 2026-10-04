import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { Empty, Loading, ToastProvider } from "./components/ui";
import { AssistantPage } from "./pages/Assistant";
import { AuthPage } from "./pages/Auth";
import { CalendarPage } from "./pages/CalendarPage";
import { EventPage, NewEventPage } from "./pages/EventPage";
import { IntegrationsPage } from "./pages/Integrations";
import { SettingsPage } from "./pages/Settings";
import { TodayPage } from "./pages/Today";
import { Link, Redirect, match, useLocation, useTitle } from "./router";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

/** Pages for a logged-in user; the first matching pattern wins. */
const ROUTES: [string, (params: Record<string, string>) => ReactNode][] = [
  ["/", () => <TodayPage />],
  ["/calendar", () => <CalendarPage />],
  ["/events/new", () => <NewEventPage />],
  ["/events/:id", ({ id }) => (/^\d+$/.test(id) ? <EventPage key={id} id={Number(id)} /> : <NotFound />)],
  ["/assistant", () => <AssistantPage />],
  ["/integrations", () => <IntegrationsPage />],
  ["/settings", () => <SettingsPage />],
];

function Routes() {
  const { user } = useAuth();
  const { path, query } = useLocation();

  if (user === undefined) return <Loading label="Focus Day" />;

  if (PUBLIC_PATHS.has(path)) {
    return user ? <Redirect to="/" /> : <AuthPage key={path} mode={path === "/login" ? "login" : "register"} />;
  }
  if (!user) {
    const here = path + (query.toString() ? `?${query}` : "");
    return <Redirect to={here === "/" ? "/login" : `/login?next=${encodeURIComponent(here)}`} />;
  }

  for (const [pattern, render] of ROUTES) {
    const params = match(pattern, path);
    if (params) return <Layout>{render(params)}</Layout>;
  }
  return (
    <Layout>
      <NotFound />
    </Layout>
  );
}

function NotFound() {
  useTitle("Не найдено");
  return (
    <div className="page">
      <Empty icon="search" title="Страница не найдена">
        <Link to="/">На главную</Link>
      </Empty>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ToastProvider>
  );
}
