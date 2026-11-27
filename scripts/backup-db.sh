#!/usr/bin/env bash
# Verschlüsseltes Datenbank-Backup (Rollen, Schema, Daten der Schemas public + auth inkl. Logins).
# Benötigt: Docker, Node, gpg. Umgebungsvariablen:
#   SUPABASE_DB_URL    Session-Pooler-Verbindung (Supabase → Connect → Session pooler, Port 5432)
#   BACKUP_PASSPHRASE  langes Passwort; OHNE dieses Passwort ist das Backup wertlos – sicher aufbewahren!
# Aufruf: scripts/backup-db.sh [zielordner]
set -euo pipefail
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL fehlt}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE fehlt}"

# Adresse bereinigen (Klammern, Leerzeichen, Sonderzeichen im Passwort); bei Fehler ohne Klartext abbrechen.
SUPABASE_DB_URL="$(DB_URL_INPUT="$SUPABASE_DB_URL" node "$(dirname "$0")/lib/db-url.cjs")" || exit 1

OUT="${1:-backup}"
SUPABASE_CLI="npx --yes supabase@3.4.0"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
STAMP="$(date -u +%Y-%m-%dT%H%MZ)"
mkdir -p "$OUT"

$SUPABASE_CLI db dump --db-url "$SUPABASE_DB_URL" -f "$WORK/roles.sql" --role-only
$SUPABASE_CLI db dump --db-url "$SUPABASE_DB_URL" -f "$WORK/schema.sql"
$SUPABASE_CLI db dump --db-url "$SUPABASE_DB_URL" -f "$WORK/data.sql" --use-copy --data-only --schema public,auth

test -s "$WORK/data.sql" || { echo "Datendump ist leer – Abbruch." >&2; exit 1; }

FILE="$OUT/frey-db-$STAMP.tar.gz.gpg"
tar -C "$WORK" -czf - roles.sql schema.sql data.sql \
  | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 \
        --symmetric --cipher-algo AES256 -o "$FILE" 3<<<"$BACKUP_PASSPHRASE"
echo "Backup erstellt: $FILE ($(du -h "$FILE" | cut -f1))"
