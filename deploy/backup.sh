#!/usr/bin/env bash
# Dump the Dayla database to $BACKUP_DIR and keep the last $KEEP_DAYS days.
# Cron (daily at 03:30): 30 3 * * * /opt/dayla/deploy/backup.sh >> /var/log/dayla-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

# Dumps contain emails, password hashes and encrypted credentials: owner-only access
umask 077

BACKUP_DIR="${BACKUP_DIR:-/var/backups/dayla}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
target="$BACKUP_DIR/dayla-$(date +%Y%m%d-%H%M%S).sql.gz"

docker compose -f docker-compose.prod.yml exec -T db \
    sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' | gzip > "$target"

find "$BACKUP_DIR" -name 'dayla-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup written to $target"
