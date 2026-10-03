# Focus Day frontend

Vite + React + TypeScript. A starting point: login/registration and a dashboard that shows the
wiring to the backend (events, integrations, Telegram status). The full feature set currently lives
in the legacy page `backend/app/templates/index.html` and can be ported here screen by screen.

- `src/api/types.ts`: types mirroring `backend/app/schemas.py`
- `src/api/client.ts`: API client. Auth uses the backend's httpOnly cookies and refreshes on 401.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api, /auth and /health to BACKEND_URL (default http://127.0.0.1:8000)
npm run build      # type-check + production build into dist/
```

In Docker, nginx serves the build and proxies `/api` and `/auth` to the `app` service (see `nginx.conf`).
Requests stay same-origin, so no CORS setup is needed.
