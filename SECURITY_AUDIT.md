# Security audit: Focus Day

Date: 2026-10-04 · Scope: `backend/`, `tg_bot/`, `frontend/`, Dockerfiles, compose and nginx
configuration · Method: manual code review, with the fixes checked by running them in a test
environment.

Findings are ordered by severity. **Fixed** means the fix is in the working tree together with
this report. The second round of fixes (items 8, 9, 13, 14, 15, 17, plus CORS and CSRF in item 18)
was tested against PostgreSQL 17:

- migrations `0019`/`0020`, upgrade and downgrade
- refresh rotation, reuse detection and logout
- the Origin check and CORS preflight
- `pip-audit` and `npm audit`

## Summary

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | Critical | Placeholder `SECRET_KEY` / `BOT_API_TOKEN` accepted, so anyone could forge sessions | Fixed |
| 2 | High | SSRF through Jira / CalDAV / Obsidian URLs | Fixed |
| 3 | High | GigaChat TLS certificate not verified (`ssl=False`) | Fixed (opt-in) |
| 4 | Medium | Login CSRF through the Google OAuth callback | Fixed |
| 5 | Medium | No brute-force protection on login | Fixed |
| 6 | Medium | Unbounded audio upload in `/api/assistant/transcribe` | Fixed |
| 7 | Medium | Swagger / OpenAPI exposed in production | Fixed |
| 8 | Medium | Refresh tokens cannot be revoked; logout only clears cookies | Fixed |
| 9 | Medium | Google OAuth tokens stored in plaintext columns | Fixed |
| 10 | Low | Missing security headers (clickjacking, MIME sniffing) | Fixed |
| 11 | Low | Unbounded lists in request bodies | Fixed |
| 12 | Low | Unescaped event title in a bot message sent with HTML parse mode | Fixed |
| 13 | Low | Containers run as root | Fixed (backend, bot) |
| 14 | Low | Login CSRF on the form-based `/auth/token` | Fixed |
| 15 | Medium | Dependencies not pinned; pypdf 5.9 has 15 known vulnerabilities | Fixed |
| 16 | Info | `INTEGRATIONS_ENCRYPTION_KEY` falls back to a key derived from `SECRET_KEY` | Warning added |
| 17 | Info | Dead code `backend/database/` and unused Google client libraries | Fixed |
| 18 | Medium | No CSRF defence beyond SameSite; no CORS policy for other frontends | Fixed |

What was already done well: passwords hashed with Argon2 (`pwdlib`); JWTs with a fixed
algorithm list and a type claim; httpOnly cookies with SameSite (`strict` for the refresh
token); every user-scoped query checks ownership (`_owned_event`, `_owned_calendar`,
`_owned_file`); constant-time comparison of the bot token; integration secrets encrypted with
Fernet and never returned by the API; an HMAC-signed, expiring OAuth `state`; random stored
file names with an extension allow-list; single-use Telegram link codes that expire after
15 minutes; HTML-escaped reminder texts; no `innerHTML` with user data in the web clients;
SQLAlchemy everywhere, with no SQL built from strings; Postgres not exposed publicly in compose.

---

## 1. Critical: default secrets accepted in production

`SECRET_KEY` defaulted to `change-me` and `.env.example` shipped `replace-with-a-random-secret`.
The key signs every JWT and the OAuth state. Anyone who knows it can mint an access token for
any `user_id` (`{"sub": "1", "type": "access"}`) and take over every account. The compose file
defaults `BOT_API_TOKEN` to `local-bot-token`. With that value, any client can call
`/internal/bot/*` to claim notifications or relink Telegram chats.

**Fix:** `Settings.validate()` (`backend/app/core/config.py`) runs at startup. With
`APP_ENV=production` (now the default in the backend Docker image) the backend refuses to start
if:

- `SECRET_KEY` is a placeholder or shorter than 32 characters
- `BOT_API_TOKEN` is set to a placeholder or is shorter than 24 characters
- `COOKIE_SECURE` is not `true`

In development it only logs warnings. `docker-compose.yml` sets `APP_ENV=development` for the
local stack.

## 2. High: SSRF through integration URLs

The Jira `site_url`, CalDAV `server_url` and Obsidian `base_url` fields are user-controlled, and
the backend sends requests to them with the user's credentials. CalDAV also follows redirects.
Any registered user could make the server call internal addresses, for example:

- `http://169.254.169.254/` (cloud metadata)
- other Amvera services on the internal network
- `127.0.0.1`

Some of the responses come back in error messages (Jira error bodies, CalDAV status codes), so
this also allowed scanning the internal network.

**Fix:** `guard_request` in `backend/app/services/integrations/base.py` is an httpx request
hook. It runs for every request, redirects included. It allows only `http`/`https` and resolves
the host. If any resolved IP isn't globally routable (loopback, private, link-local, CGNAT,
reserved), the request is refused. The hook is enabled in production. It is disabled by default
in development so that Obsidian on `127.0.0.1` still works, and `ALLOW_PRIVATE_INTEGRATION_URLS`
overrides the default.

**Remaining risk:** DNS rebinding between the check and the connection is still possible. To
remove it, pin the resolved IP in a custom transport, or route integration traffic through an
egress proxy that enforces the same rule.

## 3. High: GigaChat TLS verification disabled

Every GigaChat request, in both the backend and the bot, used `ssl=False`. That includes the
OAuth token request, which carries `SBER_AUTHORIZATION_KEY` in the `Authorization: Basic`
header. A network attacker could intercept the key and the users' messages.

**Fix:** a new `GIGACHAT_CA_BUNDLE` setting in the backend and the bot. When it points to the
Russian Trusted Root CA (PEM), certificates are verified. When it's empty, the old behaviour
stays and a warning is logged. `amvera.md` step 8 explains how to set it up. **Configure it in
production.**

## 4. Medium: login CSRF through the Google OAuth callback

`/auth/google/callback` issued **new session cookies** for the `user_id` from `state`. An
attacker could start the Google flow on their own account, stop at the redirect, and send the
callback URL (their `code` + `state`) to a victim. Opening it logged the victim into the
attacker's account, so everything the victim then entered was saved there.

**Fix:** the callback only links the Google account and redirects. It no longer issues
tokens. The user already has a session because `/auth/google/login` requires one.

## 5. Medium: no brute-force protection on login

`/auth/login` and `/auth/token` had no rate limit, which allowed unlimited password guessing.

**Fix:** an in-process limiter allows 10 failed attempts per email per 15 minutes, then returns
`429`. A successful login resets the counter. This is enough for the single backend instance on
Amvera.

**Note:** an attacker can use it to temporarily lock someone's login (15 minutes). If you scale
to several instances, move the counter to Postgres or Redis and add a per-IP limit at the proxy.

## 6. Medium: unbounded upload in `/api/assistant/transcribe`

The endpoint read the whole upload into memory with no size check and kept any
client-supplied file suffix. Large uploads could exhaust memory and disk (the backend's public
domain bypasses nginx's `client_max_body_size`).

**Fix:** uploads are capped at `MAX_FILE_SIZE_MB`, the suffix must be on an audio allow-list
(otherwise `.audio`), and ffmpeg failures return 422 instead of 500.

## 7. Medium: API docs exposed in production

`/docs`, `/redoc` and `/openapi.json` listed the full API to anyone.

**Fix:** `ENABLE_DOCS` defaults to off when `APP_ENV=production`.

## 8. Medium: refresh tokens couldn't be revoked

Refresh tokens lived for 30 days and weren't stored anywhere. `/auth/logout` only deleted the
cookies, so a stolen refresh token stayed valid until it expired.

**Fix:** a new `refresh_tokens` table (migration `0020`) records every issued refresh token by
its `jti`.

- **Rotation.** `/auth/refresh` marks the token `rotated_at` and issues a new pair. A rotated
  token still works for 30 seconds, because parallel requests on page load refresh at the same
  time.
- **Reuse detection.** Presenting a rotated token after the grace period means it was stolen.
  Every session of that user is then revoked.
- **Logout.** `/auth/logout` revokes the current token. The new `/auth/logout-all` revokes all
  of the user's tokens, and `api.auth.logoutAll()` was added to the frontend client.
- **Shorter access tokens.** The default access token lifetime dropped from 60 to 15 minutes,
  because an access token stays valid until it expires. The clients already refresh on 401.

Refresh tokens issued before this migration aren't in the table. Those users log in once more.

## 9. Medium: Google tokens stored in plaintext

`integrations.access_token` and `integrations.refresh_token` were plain columns.

**Fix:** migration `0019` moves the existing values into the Fernet-encrypted
`credentials_encrypted` and drops both columns. Downgrading restores them. Google now uses the
same `integration_secrets` / `store_secrets` path as the other providers.

## 10. Low: missing security headers

**Fix:** the backend middleware and nginx now send `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin`. The backend also
sends `Strict-Transport-Security` when `COOKIE_SECURE=true`. nginx hides its version
(`server_tokens off`).

**Recommendation:** add a Content-Security-Policy. The legacy inline-script HTML client has
been removed. The only inline script left is the theme script in `frontend/index.html`;
allow it by hash.

## 11. Low: unbounded request lists

`AssistantConfirmation.events` (each item creates a DB row and possibly a Google API call) and
`IntegrationConnect.values` had no size limit.

**Fix:** they are limited to 50 events and 20 values. `EventCreate.location` / `EventUpdate.location`
are limited to 500 characters to match the DB column (before, a longer value caused a 500).

## 12. Low: HTML injection in a bot message

The bot uses `ParseMode.HTML` by default. The legacy reminder worker (`tg_bot/bot/main.py`)
inserted `event.title` without escaping. A title with `<a href=...>` produced a link, and an
unbalanced `<` made the message fail.

**Fix:** the title is wrapped in `html.escape`, like the other messages.

## 13. Low: containers ran as root

**Fix:**

- **Bot:** runs as an unprivileged user (`uid 10001`).
- **Backend:** `docker-entrypoint.sh` starts as root only to create `STORAGE_PATH` and hand it
  to the `app` user. This is needed because Amvera mounts `/data` root-owned. It then switches
  to `app` with `gosu`, so migrations and uvicorn run unprivileged.
- **Frontend:** the nginx master process keeps root to bind port 80; its workers run as `nginx`.

## 14. Low: login CSRF on `/auth/token`

**Fix:** `/auth/token` (the OAuth2 form endpoint for Swagger and API clients) returns tokens in
the response body only and no longer sets cookies. The Origin check in item 18 also blocks
cross-site form posts to it.

## 15. Medium: unpinned and vulnerable dependencies

`backend/requirements.txt` had only `>=` bounds. `pip-audit` found **15 known vulnerabilities
in pypdf 5.9**. pypdf parses user-uploaded PDFs, so these are reachable.

**Fix:**

- Both `requirements.txt` files are pinned to exact versions, and pypdf is upgraded to 6.19.0.
- `google-api-python-client` and `google-auth-oauthlib` were never imported, so they are
  removed.
- Both images upgrade pip before installing.
- `pip-audit -r requirements.txt` now reports no known vulnerabilities for the backend or the
  bot. `npm audit` reports none for the frontend.

**Keep it that way:** run `pip-audit` and `npm audit` in CI or before each release.

## 16. Info: encryption key fallback

If `INTEGRATIONS_ENCRYPTION_KEY` is empty, integration secrets are encrypted with a key derived
from `SECRET_KEY`. Rotating `SECRET_KEY` (for example after a leak) then silently makes all
stored credentials unreadable. A startup warning is now logged. Set a separate key in
production (`amvera.md` step 1).

## 17. Info: dead code

**Fix:** `backend/database/` is deleted. It imported `bot.database.*`, which doesn't exist in the
backend.

## 18. Medium: CSRF defence and CORS

The only protection against cross-site requests was SameSite cookies. They don't stop login CSRF,
and they don't help if the API is ever opened to other origins. There was also no CORS
configuration.

**Fix:**

- **Origin check** (`backend/app/main.py`). `POST`, `PUT`, `PATCH` and `DELETE` requests that
  carry an `Origin` header are refused with `403` unless the origin is one of:
  - the site's own host (`X-Forwarded-Host` behind nginx, otherwise `Host`)
  - a listed `CORS_ORIGINS` entry

  Requests without `Origin` (the bot, curl, other non-browser clients) are unaffected. A
  browser can't forge `X-Forwarded-Host` without triggering a CORS preflight, and nginx
  overwrites it anyway.
- **CORS** comes from the `CORS_ORIGINS` allow-list (comma-separated). It's empty by default,
  which means same-origin only, and that's all the bundled frontends need.
  - Credentials are allowed only for listed origins. Allowed methods are
    `GET/POST/PUT/PATCH/DELETE`; allowed headers are `Authorization` and `Content-Type`.
  - `*` makes the backend refuse to start: credentialed CORS with a wildcard would let any site
    act as the user.
  - In production, origins must use `https://`.
  - Auth cookies stay `SameSite`, so a frontend on a different site should use Bearer tokens.

## Still open

- **DNS rebinding against the SSRF guard** (item 2). Pin the resolved IP, or use an egress proxy.
- **Content-Security-Policy.** The legacy HTML client is gone; add a CSP (allow the inline theme script in `frontend/index.html` by hash).
- **Login throttle.** It's per-process (item 5). Move it to the database or Redis before running
  more than one backend instance.

---

## Production checklist

- [ ] `SECRET_KEY` (≥ 32 chars), `BOT_API_TOKEN` (≥ 24 chars) and `INTEGRATIONS_ENCRYPTION_KEY`
      are generated randomly and stored as Amvera secrets
- [ ] `COOKIE_SECURE=true` and the site is opened only over HTTPS
- [ ] `GIGACHAT_CA_BUNDLE` is configured in the backend and the bot
- [ ] The backend's public domain is off (unless needed); the frontend and bot use the internal address
- [ ] `ENABLE_DOCS` and `ALLOW_PRIVATE_INTEGRATION_URLS` are unset (defaults are safe)
- [ ] `CORS_ORIGINS` is empty, or lists only your own `https://` frontends
- [ ] `INTEGRATIONS_ENCRYPTION_KEY` is final before the first deploy (migration `0019` encrypts with it)
- [ ] Database backups are configured; the secrets are backed up separately
- [ ] The `.env` files are not committed (`.gitignore` already covers them)
