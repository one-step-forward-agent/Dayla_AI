# Deploying Dayla to an Ubuntu server

Target: one Ubuntu 22.04/24.04 server, the site at **https://dayla.stxddd.ru**.

```
browser ──HTTPS──▶ host nginx (TLS, Let's Encrypt) ──▶ 127.0.0.1:8080 frontend container
                                                          (React build, proxies /api /auth /health)
                                                                │ Docker network
Telegram ◀── bot container ──▶ app container (FastAPI) ──▶ db container (PostgreSQL 16)
```

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
| `GIGACHAT_CA_BUNDLE` | `/certs/russian_trusted_root_ca.pem` (step 7) |
| `DEFAULT_TIMEZONE` | `Europe/Moscow` |

Leave `CORS_ORIGINS`, `ENABLE_DOCS` and `ALLOW_PRIVATE_INTEGRATION_URLS` empty.

**`tg_bot/.env`** (copy from `tg_bot/.env.example`): set `TOKEN` (from @BotFather). `BACKEND_URL`
and `BOT_API_TOKEN` come from compose.

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

## 7. GigaChat TLS certificate (recommended)

GigaChat's certificates are issued by the Russian Trusted Root CA, which isn't in the default
trust store. Without it the backend doesn't verify GigaChat's certificate (a warning is logged).

1. Download `russian_trusted_root_ca.cer` from the official Gosuslugi/Минцифры page and convert
   it if needed: `openssl x509 -inform DER -in russian_trusted_root_ca.cer -out russian_trusted_root_ca.pem`
   (if it's already PEM, just rename it).
2. Put it at `/opt/dayla/deploy/certs/russian_trusted_root_ca.pem` (mounted read-only at `/certs`).
3. Set `GIGACHAT_CA_BUNDLE=/certs/russian_trusted_root_ca.pem` in `backend/.env` and run
   `docker compose -f docker-compose.prod.yml up -d app`.

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

## Updates

```bash
cd /opt/dayla && ./deploy/deploy.sh
```

It pulls `main`, rebuilds the images and restarts what changed.

## Backups

```bash
sudo mkdir -p /var/backups/dayla && sudo chown "$USER": /var/backups/dayla
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
