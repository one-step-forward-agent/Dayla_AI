import type { ReactNode } from "react";
import { Navigate, useLocation as useRouterLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { Empty, Loading } from "./components/ui";
import { AssistantPage } from "./pages/Assistant";
import { CalendarPage } from "./pages/CalendarPage";
import { EventPage, NewEventPage } from "./pages/EventPage";
import { IntegrationsPage } from "./pages/Integrations";
import { SettingsPage } from "./pages/Settings";
import { TodayPage } from "./pages/Today";
import { Link, match, useLocation, useTitle } from "./router";
import "./app.css";

const ROUTES: [string, (params: Record<string, string>) => ReactNode][] = [
  ["/", () => <TodayPage />],
  ["/calendar", () => <CalendarPage />],
  ["/events/new", () => <NewEventPage />],
  ["/events/:id", ({ id }) => (/^\d+$/.test(id) ? <EventPage key={id} id={Number(id)} /> : <NotFound />)],
  ["/assistant", () => <AssistantPage />],
  ["/integrations", () => <IntegrationsPage />],
  ["/settings", () => <SettingsPage />],
];

export default function AppRoutes() {
  const { user } = useAuth();
  const { path } = useLocation();
  const routerLocation = useRouterLocation();

  if (user === undefined) {
    return (
      <div className="fd-app">
        <Loading label="Dayla" />
      </div>
    );
  }
  if (!user) {
    const next = routerLocation.pathname + routerLocation.search + routerLocation.hash;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  let page: ReactNode = <NotFound />;
  for (const [pattern, render] of ROUTES) {
    const params = match(pattern, path);
    if (params) {
      page = render(params);
      break;
    }
  }
  return (
    <div className="fd-app">
      <Layout>{page}</Layout>
    </div>
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
