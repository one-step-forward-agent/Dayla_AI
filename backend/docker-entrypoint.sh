#!/bin/sh
# Starts as root only to hand the (possibly freshly mounted) storage directory to the app user,
# then drops privileges for migrations and the API server.
set -e

storage="${STORAGE_PATH:-/app/storage}"

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$storage"
    find "$storage" ! -user app -exec chown app:app {} +
    exec gosu app "$0" "$@"
fi

alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
