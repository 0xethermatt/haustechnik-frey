#!/usr/bin/env bash
# Stellt ein Backup in einem NEUEN, leeren Supabase-Projekt wieder her (nie in die laufende Produktion!).
#   RESTORE_DB_URL     Verbindung zum Zielprojekt (Session-Pooler oder direkt)
#   BACKUP_PASSPHRASE  Passwort des Backups
# Aufruf: scripts/restore-db.sh frey-db-<datum>.tar.gz.gpg [--data-only]
#   --data-only: Ziel hat bereits alle Migrationen (supabase db push / db reset --no-seed)
set -euo pipefail
: "${RESTORE_DB_URL:?RESTORE_DB_URL fehlt}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE fehlt}"
FILE="${1:?Backup-Datei angeben}"
MODE="${2:-full}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 --decrypt "$FILE" 3<<<"$BACKUP_PASSPHRASE" | tar -C "$WORK" -xzf -

if [ "$MODE" = "--data-only" ]; then
  psql "$RESTORE_DB_URL" --single-transaction -v ON_ERROR_STOP=1 \
    -c 'SET session_replication_role = replica' -f "$WORK/data.sql"
else
  psql "$RESTORE_DB_URL" --single-transaction -v ON_ERROR_STOP=1 \
    -f "$WORK/roles.sql" -f "$WORK/schema.sql" \
    -c 'SET session_replication_role = replica' -f "$WORK/data.sql"
fi
echo "Wiederherstellung abgeschlossen."
