# Dayla

Personal AI planning assistant. A website (landing + web app) and a Telegram bot share one
backend and one PostgreSQL database.

| Folder | What it is |
| --- | --- |
| [`frontend/`](frontend) | The whole website in one React app: landing page, onboarding, login/registration, legal pages and the app at `/app` (Today, Calendar, Assistant, Integrations, Settings). Light and dark themes. |
| [`backend/`](backend) | FastAPI API: cookie/JWT auth, events, GigaChat assistant, integrations (Google Calendar, Apple Calendar, Jira, Notion, Obsidian), reminder engine. |
| [`tg_bot/`](tg_bot) | aiogram bot: chat with Dayla for linked accounts (plans from text, voice and documents, schedule questions, agenda), reminders with snooze. All logic goes through the backend API. |

## Run locally with Docker (everything)

```bash
cp backend/.env.example backend/.env   # fill in SECRET_KEY, Google/GigaChat keys
cp tg_bot/.env.example tg_bot/.env     # fill in TOKEN
docker compose up -d --build
```

- Website (landing + app): http://localhost:3000
- Backend API docs: http://localhost:8000/docs

Compose starts Postgres, runs the backend migrations, then
starts the backend, the bot and the frontend. Optional overrides (DB password, `BOT_API_TOKEN`)
go in a root `.env`; see `.env.example`.

## Frontend development (hot reload)

```bash
docker compose up -d db app   # or run the backend locally
cd frontend
npm install
npm run dev                   # http://localhost:5173, proxies /api, /auth and /health to :8000
```

Set `BACKEND_URL` in `frontend/.env` if the backend is not on `127.0.0.1:8000`.
See [`frontend/README.md`](frontend/README.md), [`backend/README.md`](backend/README.md) and
[`tg_bot/README.md`](tg_bot/README.md) for details.

## Deployment and security

- [`amvera.md`](amvera.md): deploying to Amvera (managed PostgreSQL plus three Docker projects).
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md): security review findings and the production checklist.
