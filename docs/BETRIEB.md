# Betriebshandbuch – Frey Betrieb (Version 1.0)

Für Admin und Büro. Hier steht, wo was liegt, was regelmäßig zu tun ist und was bei Problemen hilft.
Dieses Dokument liegt in einem öffentlichen Repository: **keine Passwörter, Schlüssel oder privaten Daten eintragen.**

## 1. Wo liegt was
| Was | Wo | Wozu |
|---|---|---|
| App | `https://haustechnik-frey.de/intern` | tägliche Nutzung (am Handy auf den Home-Bildschirm legen) |
| Code | GitHub, Repository `haustechnik-frey` | Änderungen, Backup-Lauf (Reiter „Actions“) |
| Hosting | Vercel | veröffentlicht jede Änderung, „Instant Rollback“ |
| Daten, Logins, Dateien | Supabase (Frankfurt) | Datenbank, Anmeldung, Fotos und Dokumente (Storage) |
| E-Mail-Versand | Resend (falls eingerichtet) | Einladungs- und Passwort-Mails |

**Ansprechperson / zweiter Admin:** _(hier eintragen)_

## 2. Routine
- **Täglich (Mitarbeiter):** Arbeitszeit eintragen (ein Tipp: „8,5 Std.“), Bericht schreiben oder „Arbeit ohne Kunde“ (Lager, Fahrzeug, Material). Azubis: Berufsschule über „Schule“.
- **Wöchentlich (Chef/Büro, am Wochenende):** **Kontrolle** öffnen → alles „Vollständig“? → pro Tag „freigeben“ → Aufträge zum Abrechnen unter „Abrechnungsbereit“.
- **Monatlich (Büro):** Zeitübersicht → „Stundenzettel & Excel“ → Monat wählen → Download. Einmal im Monat im Supabase-Dashboard den Speicherverbrauch ansehen (Fotos/Dokumente teilen sich 1 GB).
- **Monatlich (Admin):** Unter GitHub → Actions prüfen, dass das nächtliche „Datenbank-Backup“ grün ist, und ein Backup-Artefakt offline ablegen (USB/NAS).

## 3. Personen verwalten
- **Neuer Mitarbeiter:** Mitarbeiter → Neu (Name, Personalnummer, Beschäftigungsart, Wochenstunden, Eintrittsdatum) → danach Zugänge → „Zugang anlegen“ (Mitarbeiterdatensatz wählen, Rolle „Mitarbeiter“, Startpasswort persönlich weitergeben). Beim ersten Login legt die Person ein eigenes Passwort fest.
- **Azubi:** Beschäftigungsart „Auszubildender“, sonst fehlt „Schule“.
- **Inhaber, der auf Papier schreibt:** beim Mitarbeiter „Erfasst Arbeitszeit und Berichte selbst“ ausschalten.
- **Mitarbeiter scheidet aus:** beim Mitarbeiter ein Austrittsdatum setzen, unter Zugänge den Zugang deaktivieren. **Nicht** den Login in Supabase löschen (Berichte bleiben an ihm hängen).

## 4. Wenn etwas nicht geht
| Problem | Lösung |
|---|---|
| „Die Datenbank ist noch nicht auf dem neuesten Stand“ | Ein SQL-Update fehlt. Datei `supabase/updates/ALLE-UPDATES-2026-11-28.sql` im Supabase SQL Editor ausführen (beliebig oft ausführbar). Mit `supabase/pruefung-updates.sql` sieht man, was fehlt. |
| Neue Funktion fehlt oder Seite verhält sich seltsam nach einem Update | Handy-App neu laden; sonst vom Home-Bildschirm entfernen und neu hinzufügen. |
| Nach einer Änderung läuft etwas nicht mehr | Vercel → Deployments → vorheriges Deployment → „Instant Rollback“ (Sekunden). Alternativ auf GitHub beim Pull Request „Revert“. |
| Jemand kommt nicht mehr rein (Passwort vergessen) | In der App gibt es noch kein Zurücksetzen durch den Admin. In Supabase → Authentication → Users die Person öffnen und je nach Ansicht „Send password recovery“ oder ein neues Passwort setzen. Der Login darf nicht gelöscht werden. |
| Backup-Lauf ist rot | GitHub → Actions → Lauf öffnen → Schritt „Backup erstellen“. „password authentication failed“: Datenbank-Passwort neu setzen (Supabase → Connect → Reset database password) und das GitHub-Secret `SUPABASE_DB_URL` aktualisieren. Siehe `docs/DATENBANK-SICHERUNG.md`. |
| Etwas wurde versehentlich gelöscht | Aufträge/Berichte löschen ist endgültig. Rückholen nur aus dem Backup: `docs/DATENBANK-SICHERUNG.md` (Wiederherstellung immer in ein **neues** Projekt, nie in die laufende Produktion). Fotos und Dokumente sind im Backup nicht enthalten. |
| App/Login sagt „nicht erreichbar“ | Supabase-Gratisprojekte pausieren nach 7 Tagen ohne Aktivität. Im Supabase-Dashboard das Projekt fortsetzen („Restore/Unpause“), die Daten bleiben erhalten. |
| Speicher voll (Fotos/Dokumente) | Supabase → Usage prüfen; alte Dateien in den Aufträgen löschen oder auf Supabase Pro (ca. 25 $/Monat) wechseln. |

## 5. Änderungen an der App
Software-Änderungen laufen über GitHub: Änderung → Pull Request → Merge → Vercel veröffentlicht automatisch (1–2 Minuten). Gehört zu einer Änderung ein SQL-Update, wird es **vor** dem Merge im Supabase SQL Editor ausgeführt. Die Dateien liegen unter `supabase/updates/`.

## 6. Kosten und Grenzen (Stand Version 1.0)
Zusätzliche monatliche Kosten: 0 € (Supabase Free, Vercel, GitHub Actions). Grenzen: 1 GB Dateispeicher (Fotos und Dokumente), 500 MB Datenbank, keine von Supabase gesicherten Backups (daher das eigene nächtliche Backup), Pause nach 7 Tagen ohne Nutzung.
