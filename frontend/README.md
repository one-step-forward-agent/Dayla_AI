# Dayla frontend

One React app for the whole site: the public landing, onboarding, sign-in and the product itself.
It is served by nginx in Docker (behind the host nginx in production, see `DEPLOY.md`), with the backend proxied on the same origin.

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Landing page (logged-in visitors go straight to `/app`) | `src/components/onboarding/Start.tsx`, `src/components/landing/` |
| `/onboarding/*` | Ten-step onboarding. Answers are kept in `sessionStorage` and applied after sign-up: timezone, plus the first task as an event tomorrow | `src/components/onboarding/` |
| `/login`, `/register` | Auth screens (`?next=` returns you to the page you came from) | `src/pages/Auth/`, `src/layouts/AuthLayout.tsx` |
| `/terms-of-use`, `/personal-data-consent` | Legal documents (Markdown) | `src/pages/Documents/` |
| `/app/*` | The product: Today, Calendar, Event, Assistant, Integrations, Settings | `src/app/` |

## Design and themes

- The landing, onboarding and auth pages use Tailwind (`tailwind.config.js`, `src/index.css`).
- The app under `/app` uses `src/app/app.css`, which is scoped to `.fd-app` and follows the same visual language: Inter, a blue→violet gradient, and glass cards on a soft grid.
- **Themes:** light, dark, or follow the system.
  - `src/theme.tsx` stores the choice in `localStorage` (`dayla-theme`) and sets the `dark` class on `<html>`. Tailwind (`darkMode: "class"`) and `app.css` both key off that class.
  - A small script in `index.html` applies the theme before first paint.
  - The toggle is in every header. Settings → Appearance also offers "Как в системе" (follow the system).
- **Font:** Inter is self-hosted (`@fontsource-variable/inter`), so no request goes to Google Fonts.

## State and API

- `src/app/api/client.ts` is the single API client.
  - Sessions use the backend's httpOnly cookies. On 401 the client makes one shared refresh call and retries.
  - `GET /api/public/config` provides the Telegram bot link for the landing footer.
- `src/store/authStore.ts` (zustand) is the single session store, shared by the landing header, the auth pages and the app.
- `src/app/router.tsx` lets the app's pages use paths relative to `/app` on top of react-router.

## Development

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api, /auth and /health to BACKEND_URL (default http://127.0.0.1:8000)
npm run build      # type-check + production build into dist/
```

The dev proxy keeps the browser's `Host` header (`changeOrigin: false`), because the backend
rejects writes whose `Origin` doesn't match the host (CSRF protection).

In Docker, nginx serves the build and proxies `/api`, `/auth` and `/health` to the backend at
`BACKEND_URL` (default `http://app:8000`, see `nginx.conf.template`). Hashed assets are cached
for a year, and pages are revalidated on every load.

## Content to review before launch

- `src/pages/Documents/md_texts/*.md`: the terms and the personal-data consent come from the
  organisation's previous product ("Prosklad") and must be replaced with Dayla's legal texts.
- The support email in the footer (`LandingFooter.tsx`) is the organisation's address.

Landing code is © MentrixLabs, MIT License; see `THIRD_PARTY_NOTICES.md`.
