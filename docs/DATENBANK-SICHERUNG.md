# Datenbank-Sicherung (Frey Betrieb)

## Was gesichert wird
Täglich gegen 3–4 Uhr (GitHub Actions, „Datenbank-Backup“): alle Daten der Schemas `public` und `auth` (inkl. Logins), Schema und Rollen. Verschlüsselt mit `BACKUP_PASSPHRASE` (AES-256), 90 Tage aufbewahrt als Artefakt des Workflows.

**Nicht gesichert:** Fotos und Dokumente (Dateien im Supabase-Storage).

## Einrichtung (einmalig)
1. **Passphrase:** langes Passwort (mind. 24 Zeichen) im Passwortmanager erzeugen und **getrennt** aufbewahren. Ohne sie ist jedes Backup wertlos.
2. **Datenbank-Verbindung:** Supabase → Projekt → *Connect* → **Session pooler** → URI kopieren, `[YOUR-PASSWORD]` durch das Datenbank-Passwort ersetzen (Sonderzeichen URL-kodieren oder ein Passwort nur aus Buchstaben und Ziffern wählen; Neues Passwort: Project Settings → Database → Reset database password).
   Das Skript bereinigt die Adresse selbst (Klammern um das Passwort, Leerzeichen/Zeilenumbrüche, Sonderzeichen im Passwort); bei einer unlesbaren Adresse bricht es mit einer verständlichen Meldung ab, ohne das Passwort auszugeben.
   Warum der Session pooler: Die direkte Verbindung ist nur per IPv6 erreichbar, GitHub-Runner nutzen IPv4.
3. **GitHub-Secrets** (Repository → Settings → Secrets and variables → Actions → New repository secret):
   - `SUPABASE_DB_URL` = die URI aus Schritt 2
   - `BACKUP_PASSPHRASE` = die Passphrase aus Schritt 1
4. **Testlauf:** Actions → *Datenbank-Backup* → *Run workflow*. Nach ca. 2 Minuten grün; unten unter *Artifacts* liegt `db-backup-<Nr>`.

## Wiederherstellen (nur in ein NEUES, leeres Supabase-Projekt, nie in die laufende Produktion)
1. Artefakt herunterladen und entpacken → Datei `frey-db-<Datum>.tar.gz.gpg`.
2. Neues Supabase-Projekt anlegen, im Repository `supabase db push` mit der Zielverbindung ausführen (spielt alle Migrationen ein).
3. `RESTORE_DB_URL="<Verbindung des neuen Projekts>" BACKUP_PASSPHRASE="<Passphrase>" scripts/restore-db.sh frey-db-<Datum>.tar.gz.gpg --data-only`
4. In Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` auf das neue Projekt umstellen und neu deployen.

Der Ablauf (Sichern → leere Datenbank → Wiederherstellen) wurde lokal mit Testdaten geprüft: Kunden, Berichte, Zeiten, Arbeitstage und Logins kamen vollständig zurück.
