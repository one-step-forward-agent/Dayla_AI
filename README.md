# Focus Day

Calendar assistant: a web app and a Telegram bot sharing one backend and one PostgreSQL database.

| Folder | What it is |
| --- | --- |
| [`backend/`](backend) | FastAPI API: JWT auth, events, GigaChat assistant, integrations (Google Calendar, Apple Calendar, Jira, Notion, Obsidian), reminder engine. Also serves a legacy single-page HTML client at `/`. |
| [`tg_bot/`](tg_bot) | aiogram bot: events from text, documents and voice; account linking and delivery of reminders queued by the backend. |
| [`frontend/`](frontend) | Vite + React + TypeScript foundation for the new web client, with a typed API client. |

## Quick start

```bash
cp backend/.env.example backend/.env   # fill in SECRET_KEY, Google/GigaChat keys
cp tg_bot/.env.example tg_bot/.env     # fill in TOKEN and GigaChat keys
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Legacy HTML client: http://localhost:8000

Compose starts Postgres, runs the backend migrations (they also cover the bot's tables), then starts the backend, the bot and the frontend. Optional overrides (DB password, `BOT_API_TOKEN`) go in a root `.env` — see `.env.example`.

## Frontend development

```bash
docker compose up -d db app   # or run the backend locally
cd frontend
npm install
npm run dev                   # http://localhost:5173, proxies /api and /auth to :8000
```

Set `BACKEND_URL` in `frontend/.env` if the backend is not on `127.0.0.1:8000`.

See [`backend/README.md`](backend/README.md) and [`tg_bot/README.md`](tg_bot/README.md) for service details.

## Deployment and security

- [`amvera.md`](amvera.md): deploying to Amvera (managed PostgreSQL plus three Docker projects).
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md): security review findings and the production checklist.
