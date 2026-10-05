# Deploying Dayla to an Ubuntu server

Target: one Ubuntu 22.04/24.04 server, the site at **https://dayla.stxddd.ru**.

```
browser ──HTTPS──▶ host nginx (TLS, Let's Encrypt) ──▶ 127.0.0.1:8080 frontend container
                                                          (React build, proxies /api /auth /health /internal)
                                                                │ Docker network
Telegram ◀── bot container ──▶ app container (FastAPI) ──▶ db container (PostgreSQL 16)
```

The bot can run on this server (inside the same compose stack) or on a separate server
(see [Bot on Amvera](#bot-on-amvera)).

Everything runs from [`docker-compose.prod.yml`](docker-compose.prod.yml). Only the frontend is
published, and only on `127.0.0.1:8080`; Postgres, the API and the bot are reachable only on the
internal Docker network.

## 1. DNS

Create an `A` record `dayla.stxddd.ru → <server IPv4>` (and `AAAA` if the server has IPv6).
Check it before requesting the certificate: `dig +short dayla.stxddd.ru`.

## 2. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw

# Docker Engine + compose plugin (official repository)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"     # log out and back in afterwards

# Firewall: SSH and HTTP/HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

> Docker publishes ports past `ufw`. That's why the compose file binds the frontend to
> `127.0.0.1` only; don't change it to `0.0.0.0`.

## 3. Get the code

```bash
sudo mkdir -p /opt/dayla && sudo chown "$USER": /opt/dayla
git clone <repository-url> /opt/dayla
cd /opt/dayla
```

## 4. Secrets and settings

Generate the secrets (any machine with Python):

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"   # SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"   # BOT_API_TOKEN
python3 -c "import secrets; print(secrets.token_urlsafe(32))"   # POSTGRES_PASSWORD
python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"   # INTEGRATIONS_ENCRYPTION_KEY
```

Keep them in a password manager. `INTEGRATIONS_ENCRYPTION_KEY` encrypts users' Jira, Notion,
CalDAV, Obsidian and Google credentials. If it's lost or changed, users have to reconnect them.

**`.env`** (repository root, read by compose):

```ini
DOMAIN=dayla.stxddd.ru
# Run the Telegram bot on this server too. Remove the line if the bot runs on Amvera.
COMPOSE_PROFILES=bot
POSTGRES_DB=focus_day
POSTGRES_USER=focus_day
POSTGRES_PASSWORD=<generated>
BOT_API_TOKEN=<generated>
```

**`backend/.env`** (copy from `backend/.env.example`). Compose already sets `APP_ENV=production`,
`DATABASE_URL`, `COOKIE_SECURE=true`, `PUBLIC_APP_URL`, `GOOGLE_REDIRECT_URI`, `STORAGE_PATH` and
`BOT_API_TOKEN`, so fill in only:

| Variable | Value |
| --- | --- |
| `SECRET_KEY` | generated |
| `INTEGRATIONS_ENCRYPTION_KEY` | generated |
| `SBER_AUTHORIZATION_KEY` | GigaChat key |
| `SBER_SCOPE` / `GIGACHAT_MODEL` | `GIGACHAT_API_PERS` / `GigaChat` (or yours) |
| `TELEGRAM_BOT_USERNAME` | bot username without `@` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional, for Google Calendar |
| `DEFAULT_TIMEZONE` | `Europe/Moscow` |

Leave `CORS_ORIGINS`, `ENABLE_DOCS` and `ALLOW_PRIVATE_INTEGRATION_URLS` empty.

**`tg_bot/.env`** (only if the bot runs on this server; copy from `tg_bot/.env.example`): set
`TOKEN` (from @BotFather). `BACKEND_URL` and `BOT_API_TOKEN` come from compose.

`BOT_API_TOKEN` is not the Telegram token: it's a password you generate, which the bot sends to
the backend with every request.

```bash
chmod 600 .env backend/.env tg_bot/.env
```

In production mode the backend refuses to start with a short or placeholder `SECRET_KEY` /
`BOT_API_TOKEN`; the reason is in `docker compose -f docker-compose.prod.yml logs app`.

## 5. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # all services "running"/"healthy"
curl -s http://127.0.0.1:8080/health                 # {"status":"ok"}
```

On every start the backend runs `alembic upgrade head`.

## 6. nginx and HTTPS

```bash
sudo cp deploy/nginx/dayla.stxddd.ru.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/dayla.stxddd.ru.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d dayla.stxddd.ru --redirect -m <your-email> --agree-tos
```

certbot adds the TLS settings and the HTTP→HTTPS redirect to the site file and installs a
renewal timer (`systemctl list-timers | grep certbot`). The backend sends HSTS itself.

## 7. GigaChat TLS certificate

Nothing to do. GigaChat's certificates are issued by the Russian Trusted Root CA (Минцифры), which
isn't in the default trust store, so the backend image ships it
(`backend/certs/russian_trusted_root_ca.pem`, SHA-256
`D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31`,
valid until 2032) and verifies GigaChat with it. Leave `GIGACHAT_CA_BUNDLE` empty; set it only to
use a different CA file.

## 8. Google OAuth

In Google Cloud Console → Credentials → your OAuth client add the redirect URI
`https://dayla.stxddd.ru/auth/google/callback`, and add `dayla.stxddd.ru` to the consent screen's
authorized domains.

## 9. Check

1. `https://dayla.stxddd.ru/health` → `{"status":"ok"}`.
2. The landing page opens; "Начать бесплатно" → onboarding. On the "Что подключим?" step create an
   account, connect Google Calendar (you come back to the same step), Jira or Apple Calendar
   (form in a dialog) and Telegram (opens the bot). Finish onboarding; you land in `/app`.
3. Settings → Telegram → "test reminder" arrives in the bot.
4. `docker compose -f docker-compose.prod.yml logs bot` has no `401 Invalid bot token`.

## Bot on Amvera

The bot can run on [Amvera](https://amvera.ru) instead of this server. It only needs HTTPS access
to `https://dayla.stxddd.ru`: it calls the backend's `/internal/bot/*` API, authenticated with
`BOT_API_TOKEN` (requests without the right token get `401`). Amvera has no fixed outgoing IP, so
there is no IP allowlist; keep `BOT_API_TOKEN` long and random. Run **one** bot only: two bots
polling with the same Telegram token conflict (`TelegramConflictError`).

**On this server**

Remove `COMPOSE_PROFILES=bot` from the root `.env`, then stop the local bot and redeploy (the
frontend image must be rebuilt so that it forwards `/internal`):

```bash
docker compose -f docker-compose.prod.yml rm -sf bot
./deploy/deploy.sh
```

**On Amvera**

1. Create an application project (e.g. `dayla-bot`), environment **Docker**. `tg_bot/amvera.yml`
   configures the build; Amvera reads it from the repository root, so push the `tg_bot/` folder
   as the root of the Amvera repository (commit your changes first):
   ```bash
   git remote add amvera-bot https://git.amvera.ru/<amvera-user>/dayla-bot
   git push amvera-bot "$(git subtree split --prefix tg_bot HEAD)":refs/heads/master --force
   ```
   Git asks for your Amvera login and password. Run the same `git push` to update the bot later.
   (Or upload the contents of `tg_bot/` in the project's Repository tab; `amvera.yml` must be at
   the top level.)
2. In the project's **Variables** set (mark the first and third as secrets):

   | Variable | Value |
   | --- | --- |
   | `TOKEN` | token from @BotFather |
   | `BACKEND_URL` | `https://dayla.stxddd.ru` |
   | `BOT_API_TOKEN` | the same value as `BOT_API_TOKEN` in this server's root `.env` |
   | `NOTIFICATION_POLL_SECONDS` | `20` |

3. Restart the project after setting the variables and open its logs.

The bot needs no public domain (it uses long polling).

**Check**

- From any machine: `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://dayla.stxddd.ru/internal/bot/notifications/claim`
  returns `401` (the API is reachable). `200` with HTML or `404` means this server's frontend image
  is old: run `./deploy/deploy.sh`.
- Write to the bot; in Settings → Telegram on the site, link the account and send a test reminder.

| Bot log message | Cause |
| --- | --- |
| `401 Invalid bot token` | `BOT_API_TOKEN` differs between Amvera and this server's `.env`. |
| `503 BOT_API_TOKEN is not configured` | The backend on this server has no `BOT_API_TOKEN`. |
| `TelegramConflictError` | Another copy of the bot (this server's, or a local one) is still running. |
| Connection errors to `dayla.stxddd.ru` | The site is down or DNS/HTTPS is broken; check `https://dayla.stxddd.ru/health`. |

## Security notes

- **Rate limits** (frontend nginx, per client IP): login/registration 10/min, assistant 30/min, bot
  API 10/s, the rest of the API 20/s. The backend also limits failed logins (10 per email and 30 per
  IP per 15 minutes), registrations (10 per IP per hour) and, per user, assistant requests
  (60/hour) and voice/document processing (30/hour). Limits are kept in memory: restarting the
  backend resets them. They need the real client IP, which the host nginx passes in `X-Real-IP`
  (already in `deploy/nginx/dayla.stxddd.ru.conf`).
- **`BOT_API_TOKEN`** gives access to every Telegram-linked account through `/internal/bot/*`, which
  is public because the bot runs on Amvera. Keep it only in this server's `.env` and as a secret in
  Amvera. If it may have leaked, generate a new one, put it in both places and restart:
  `docker compose -f docker-compose.prod.yml up -d app`, then restart the Amvera project.
- **Google Calendar** links only to the Dayla account that is logged in in the same browser. If
  someone opens a connect link created by another account, they get `403`.
- **Integrations** (Jira, CalDAV, Obsidian) can't reach private or internal addresses; the server
  connects only to the address it checked.

## Updates

```bash
cd /opt/dayla && ./deploy/deploy.sh
```

It pulls `main`, rebuilds the images and restarts what changed.

## Backups

```bash
sudo mkdir -p /var/backups/dayla && sudo chown "$USER": /var/backups/dayla && chmod 700 /var/backups/dayla
./deploy/backup.sh                         # writes /var/backups/dayla/dayla-<date>.sql.gz
crontab -e                                 # add:
# 30 3 * * * /opt/dayla/deploy/backup.sh >> /var/backups/dayla/backup.log 2>&1
```

Copy the dumps off the server as well, and back up `.env`, `backend/.env` and `tg_bot/.env`:
without `INTEGRATIONS_ENCRYPTION_KEY` the stored integration credentials can't be decrypted.

Restore:

```bash
gunzip -c /var/backups/dayla/dayla-<date>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `app` keeps restarting with `Insecure production configuration: ...` | Fix the variable named in the message (step 4). |
| `502 Bad Gateway` from host nginx | The stack isn't running or `127.0.0.1:8080` is taken; check `docker compose ... ps`. |
| `502` on `/api/...` only | The `app` container is down or still migrating; check its logs. |
| Logged out right after login | Site opened over plain HTTP; secure cookies need HTTPS. |
| Google: `redirect_uri_mismatch` | The redirect URI in Google Cloud doesn't exactly match step 8. |
| Bot: `TelegramConflictError` | Another copy of the bot (e.g. a local one) polls with the same token. |
| Integration error "address points to the internal network" | Jira/CalDAV/Obsidian URL resolves to a private IP; blocked in production. Obsidian's Local REST API on `127.0.0.1` can't work from a server. |
