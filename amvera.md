# Deploying Dayla to Amvera

Amvera runs one container per project and has no docker-compose, so the stack becomes
**four Amvera projects**:

| Amvera project | Type | Source folder | Port | Public domain |
| --- | --- | --- | --- | --- |
| `dayla-db` | Managed PostgreSQL | — | 5432 | no |
| `dayla-backend` | Docker app | `backend/` | 8000 | optional (see step 7) |
| `dayla-bot` | Docker app | `tg_bot/` | — (long polling) | no |
| `dayla-web` | Docker app | `frontend/` | 80 | **yes**, the site users open |

```
browser ──HTTPS──▶ dayla-web (nginx: React build, proxies /api /auth /health)
                         │ internal network
                         ▼
Telegram ◀── dayla-bot ──▶ dayla-backend ──▶ dayla-db (PostgreSQL)
```

The names above are examples; use your own and replace them everywhere below.
`<user>` is your Amvera username.

Each service folder already contains an `amvera.yml` (Docker build, `containerPort`, persistent
storage mounted at `/data`). Amvera reads `amvera.yml` from the **root** of the project
repository, so every folder is pushed to its own Amvera project as the repository root (step 3).

---

## 1. Prepare secrets

Generate them locally and keep them in a password manager. Never commit them.

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"   # SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"   # BOT_API_TOKEN (same value in backend and bot)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"   # INTEGRATIONS_ENCRYPTION_KEY
```

You also need: the Telegram bot token from @BotFather, the GigaChat authorization key
(`SBER_AUTHORIZATION_KEY`), and, if you use Google Calendar, a Google OAuth client.

> `INTEGRATIONS_ENCRYPTION_KEY` encrypts users' Jira/Notion/CalDAV/Obsidian credentials in the
> database. If you lose or change it, users have to reconnect their integrations.

## 2. Create the database

1. In Amvera create a **PostgreSQL** project, e.g. `dayla-db`. Set the database name
   (`focus_day`), user and a long password.
2. Open the project info and note the **internal hostname of the read-write instance**
   (it looks like `amvera-<user>-cnpg-dayla-db-rw`).
3. Build the connection string used by the backend:

   ```
   postgresql+asyncpg://<db-user>:<db-password>@amvera-<user>-cnpg-dayla-db-rw:5432/focus_day
   ```

   URL-encode the password if it contains `@ : / ? # %` etc. Plain `postgres://` URLs are also
   accepted and converted to `postgresql+asyncpg://`. Only the backend connects to the
   database; the bot talks to the backend's API.

## 3. Create the three application projects and push the code

Create three **application** projects in Amvera (`dayla-backend`, `dayla-bot`, `dayla-web`),
choosing the Docker environment. Amvera gives every project its own Git repository
(`https://git.amvera.ru/<user>/<project>`).

The deploy pushes **committed** code, so commit your changes first. Then push each folder as
the repository root with `git subtree split`:

```bash
git remote add amvera-backend https://git.amvera.ru/<user>/dayla-backend
git remote add amvera-bot     https://git.amvera.ru/<user>/dayla-bot
git remote add amvera-web     https://git.amvera.ru/<user>/dayla-web

git push amvera-backend "$(git subtree split --prefix backend  HEAD)":refs/heads/master --force
git push amvera-bot     "$(git subtree split --prefix tg_bot   HEAD)":refs/heads/master --force
git push amvera-web     "$(git subtree split --prefix frontend HEAD)":refs/heads/master --force
```

Git asks for your Amvera username and password. Run the same `git push` line again to redeploy
a service after new commits. (Instead of Git you can upload the contents of a folder through
the project's repository page in the Amvera UI; `amvera.yml` must be at the top level.)

Each push starts a build. Configure the variables (steps 4–6) before the first start, or
restart the project after setting them.

## 4. Backend variables (`dayla-backend`)

Set them in the project's **Variables** section. Mark everything marked "secret" below as a
**secret**.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | connection string from step 2 (**secret**) |
| `SECRET_KEY` | generated in step 1 (**secret**) |
| `INTEGRATIONS_ENCRYPTION_KEY` | generated in step 1 (**secret**) |
| `BOT_API_TOKEN` | generated in step 1 (**secret**) |
| `COOKIE_SECURE` | `true` |
| `STORAGE_PATH` | `/data/storage` (persistent storage; uploaded files survive redeploys) |
| `DEFAULT_TIMEZONE` | `Europe/Moscow` |
| `SBER_AUTHORIZATION_KEY` | GigaChat key (**secret**) |
| `SBER_SCOPE` | `GIGACHAT_API_PERS` (or your scope) |
| `GIGACHAT_MODEL` | `GigaChat` |
| `TELEGRAM_BOT_USERNAME` | bot username without `@` (for the t.me link) |
| `PUBLIC_APP_URL` | `https://<dayla-web domain>`; enables the bot's "Открыть в Dayla" buttons |
| `GOOGLE_CLIENT_ID` | optional, Google OAuth |
| `GOOGLE_CLIENT_SECRET` | optional, Google OAuth (**secret**) |
| `GOOGLE_REDIRECT_URI` | `https://<dayla-web domain>/auth/google/callback` |
| `GIGACHAT_CA_BUNDLE` | optional, see step 8 |
| `CORS_ORIGINS` | leave empty (see below) |

`CORS_ORIGINS` is only needed if a frontend on **another domain** calls the API directly from
the browser, for example `https://app.example.com`. List those origins separated by commas,
`https://` only; `*` is rejected. The bundled frontend goes through its own nginx on the same
origin and doesn't need it. Auth cookies are `SameSite`, so a frontend on a different site must
send the access token in the `Authorization: Bearer` header.

The container starts as root only to give `/data/storage` to the unprivileged `app` user. It
then runs migrations and the API as that user.

The image runs with `APP_ENV=production`. In that mode the backend **refuses to start** if
`SECRET_KEY` is shorter than 32 characters or a placeholder, if `BOT_API_TOKEN` is a placeholder
or shorter than 24 characters, or if `COOKIE_SECURE` is not `true`. The reason is printed in
the project logs. Swagger (`/docs`, `/openapi.json`) is off; set `ENABLE_DOCS=true` to turn it
on temporarily.

On every start the container runs `alembic upgrade head` and then starts uvicorn on port 8000.

> **Upgrading an existing database:** migration `0019` moves Google OAuth tokens into the
> encrypted credentials column, using the current `INTEGRATIONS_ENCRYPTION_KEY` (or `SECRET_KEY`).
> Set the final key **before** the first deploy of this version. Migration `0020` adds the
> `refresh_tokens` table, so users who were logged in before it must log in again once.

## 5. Bot variables (`dayla-bot`)

| Variable | Value |
| --- | --- |
| `TOKEN` | Telegram bot token (**secret**) |
| `BACKEND_URL` | internal address of the backend, e.g. `http://amvera-<user>-run-dayla-backend:8000` |
| `BOT_API_TOKEN` | same value as the backend (**secret**) |
| `NOTIFICATION_POLL_SECONDS` | `20` |

The bot has no database access and no GigaChat key: chat messages, schedule questions,
reminders and account linking all go through the backend's `/internal/bot/*` API. The bot
itself only transcribes voice messages and extracts text from PDF/DOCX files.
Run **only one** instance of the bot; two instances using long polling with the same token
conflict.

> **Internal address.** Amvera shows each project's internal hostname in its info page
> (format `amvera-<user>-run-<project>`). Use the hostname and port it shows. If internal
> networking isn't available on your plan, use the backend's public URL instead
> (`https://<dayla-backend domain>`).

## 6. Frontend variables (`dayla-web`)

| Variable | Value |
| --- | --- |
| `BACKEND_URL` | internal address of the backend, same as for the bot (no trailing slash) |

nginx reads `BACKEND_URL` when the container starts (`nginx.conf.template`). A public HTTPS
backend URL also works.

Turn on the public domain for `dayla-web` (Amvera issues HTTPS automatically). This is the
address users open, and it is the origin for the auth cookies. The one site contains the
landing page (`/`), onboarding, login and registration, the legal documents and the app (`/app`).
nginx serves every path as the single-page app, so direct links and page reloads work.

The landing footer's Telegram links come from `GET /api/public/config`, which returns the bot
username from `TELEGRAM_BOT_USERNAME` (or Telegram's `getMe`). Set `TELEGRAM_BOT_USERNAME` on
`dayla-backend` so the links appear.

## 7. Domains and Google OAuth

- **Users open `https://<dayla-web domain>`.** The React app and the API share that origin, so
  the httpOnly cookies work without CORS.
- **Backend public domain.** The backend doesn't need one when the frontend and bot use its
  internal address. Leaving it off is safer: `/internal/bot/*` is then reachable only inside
  Amvera. Turn it on only if the bot uses the public URL.
- **Google OAuth.** In Google Cloud Console → Credentials → your OAuth client, add the
  redirect URI `https://<dayla-web domain>/auth/google/callback`. It must match
  `GOOGLE_REDIRECT_URI` exactly. Add the domain to the OAuth consent screen.

## 8. (Recommended) Verify GigaChat's TLS certificate

GigaChat's certificates are issued by the Russian Trusted Root CA (Минцифры), which is not in
the default trust store. Without the CA, the services skip verification of GigaChat's
certificate (a warning is logged), so a man-in-the-middle could steal the GigaChat key.

1. Download the CA certificate in PEM format from the official Gosuslugi/Минцифры page
   (`russian_trusted_root_ca.cer`, see GigaChat's documentation on certificates).
2. Upload it to the persistent storage (`/data`) of `dayla-backend` via the Amvera UI, e.g. as
   `/data/russian_trusted_root_ca.pem`.
3. Set `GIGACHAT_CA_BUNDLE=/data/russian_trusted_root_ca.pem` on `dayla-backend` and restart it.

If the path is wrong, GigaChat requests fail with an SSL error in the logs. Remove the
variable to go back to the previous behaviour.

## 9. Check the deployment

1. `dayla-backend` logs: `alembic upgrade head` finished, then `Uvicorn running on http://0.0.0.0:8000`.
2. `https://<dayla-web domain>/health` returns `{"status":"ok"}`.
3. Open `https://<dayla-web domain>/`: the landing loads, and the theme toggle in the header
   switches light/dark. Go through "Начать бесплатно" → onboarding → registration; you land
   in `/app`, and the first task from onboarding is on tomorrow's agenda.
4. Settings → Telegram → link the account and press "test reminder"; the bot sends it within
   `NOTIFICATION_POLL_SECONDS`.
5. Write the bot a plan, e.g. "завтра в 15:00 созвон", then ask "что у меня завтра?". The event
   appears in the bot's reply and in the web calendar.
6. `dayla-bot` logs have no `401 Invalid bot token` (that means the `BOT_API_TOKEN` values differ).

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Backend exits with `Insecure production configuration: ...` | Fix the variable named in the message (step 4). |
| `502 Bad Gateway` on `/api/...` | `BACKEND_URL` of `dayla-web` is wrong, or the backend isn't running. |
| nginx exits with `host not found in upstream` | The backend hostname in `BACKEND_URL` doesn't resolve; check it in the backend's info page. |
| Login works but you're logged out immediately | Site opened over plain HTTP; `COOKIE_SECURE=true` cookies need HTTPS. |
| Bot: `Telegram chat is not linked` / `401` | `BOT_API_TOKEN` differs between bot and backend, or wrong `BACKEND_URL`. |
| Bot answers "подключите аккаунт" after linking | The bot's `BACKEND_URL` points to a different backend than the site. |
| No "Открыть в Dayla" button under bot replies | `PUBLIC_APP_URL` is empty or not `https://` (Telegram rejects other links). |
| Bot: `TelegramConflictError` | Two bot instances (or a local bot) are polling with the same token. |
| Integration error "address points to the internal network" | Jira/CalDAV/Obsidian URL resolves to a private IP. This is blocked in production (see `SECURITY_AUDIT.md`). Obsidian's Local REST API on `127.0.0.1` can't work from a cloud server anyway. |
| Uploaded files disappear after redeploy | `STORAGE_PATH` isn't under `/data`. |

## Backups

Configure backups for `dayla-db` in Amvera, or run `pg_dump` regularly. Also back up the
`INTEGRATIONS_ENCRYPTION_KEY` and `SECRET_KEY` values: without the first one the stored
integration credentials can't be decrypted.
