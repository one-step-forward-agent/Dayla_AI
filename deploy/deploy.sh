#!/usr/bin/env bash
# Pull the latest code and rebuild/restart the production stack.
# Usage (on the server, from the repository root): ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

for file in .env backend/.env; do
    [ -f "$file" ] || { echo "Missing $file (see DEPLOY.md)" >&2; exit 1; }
done

if grep -q '^COMPOSE_PROFILES=.*bot' .env && [ ! -f tg_bot/.env ]; then
    echo "Missing tg_bot/.env (COMPOSE_PROFILES=bot is set in .env)" >&2; exit 1
fi

git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f >/dev/null

docker compose -f docker-compose.prod.yml ps
