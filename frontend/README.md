# Focus Day frontend

Vite + React + TypeScript web client. It's multi-page and responsive: a sidebar on desktop, a top
bar plus bottom tab bar on phones, and light and dark themes that follow the system. It has no
dependencies beyond React.

| Page | Path | What it does |
| --- | --- | --- |
| Today | `/` | Greeting, the next event, today's agenda, the week ahead, and a one-line input for the assistant |
| Calendar | `/calendar?month=YYYY-MM&day=YYYY-MM-DD` | Month grid (titles on desktop, dots on phones) with the selected day's events |
| Event | `/events/:id` | Details, edit and delete, file attachments (upload, extract text, delete), send to Google, Apple, Jira, Notion and Obsidian |
| New event | `/events/new?day=YYYY-MM-DD` | Event form: all-day, priority, per-event reminder, calendar, place, notes |
| Assistant | `/assistant` | GigaChat chat. "Plan" turns text, voice or a PDF/DOCX into proposed events to confirm. "Find" searches the calendar |
| Integrations | `/integrations` | Connect (OAuth for Google, forms for the rest), test, sync, disconnect (optionally removing imported events) |
| Settings | `/settings` | Profile and timezone; reminders (lead times, morning plan, quiet hours, sources); Telegram linking, a test message and history; calendars and `.ics` export; logout, or logout from every device |
| Login / Register | `/login`, `/register` | After login you return to the page you came from (`?next=`) |

## Code map

- `src/api/`: `types.ts` mirrors `backend/app/schemas.py`. `client.ts` is the API client: it uses httpOnly cookies, makes one shared refresh call on 401, and sends you to login when the session is gone.
- `src/router.tsx`: a small History-API router with `Link`, `navigate`, `useLocation` and `match`.
- `src/auth.tsx`: the session context (`useAuth`, `useUser`).
- `src/components/`: `Layout` (navigation), `ui` (buttons, cards, fields, dialog, toasts, error boundary), `events` (event list and form), `icons`.
- `src/pages/`: one file per page.
- `src/lib/`: date formatting helpers and the `useAsync` / `useAction` hooks.

## Development

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api, /auth and /health to BACKEND_URL (default http://127.0.0.1:8000)
npm run build      # type-check + production build into dist/
```

The dev proxy keeps the browser's `Host` header (`changeOrigin: false`), because the backend
rejects writes whose `Origin` doesn't match the host (CSRF protection).

In Docker, nginx serves the build and proxies `/api` and `/auth` to the backend at
`BACKEND_URL` (default `http://app:8000`, see `nginx.conf.template`). Requests stay same-origin,
so no CORS setup is needed.
