# Frey Haustechnik – Internal Operations Platform

Internal, invite-only operations app for field reports and time tracking, living at **`/intern`** inside the existing
Next.js website repository. Edison Handwerk stays the accounting/invoicing system; this platform is the operational data
layer between field staff, office and accounting.

> Status: **MVP implemented and verified locally** (unit, database/RLS and end-to-end tests green).
> Not yet deployed: a Supabase project and Vercel environment variables are required (see [Deployment](#7-deployment-checklist)).

---

## 1. Repository findings (before implementation)

| Area | Finding | Consequence |
|---|---|---|
| App | Public marketing site, Next.js **14.2.0** App Router, Tailwind 3, no auth, no DB | Internal app added alongside, site untouched |
| Security | Next 14.2.0 is affected by the middleware authorization bypass (CVE-2025-29927) | Upgraded to **14.2.35** (same minor, no API changes). Auth is additionally enforced in layouts, server actions and RLS |
| Layout | Root layout injects cookie banner, heat-pump banner, AI chat widget, analytics | Website moved into route group `app/(site)/` **without URL changes**; internal app gets its own root layout `app/(ops)/` |
| Styling | Website Tailwind config with brand colours, Arial | Internal app uses a **separate** Tailwind config (`tailwind.ops.config.ts`, loaded via `@config` in `app/(ops)/ops.css`) → zero style bleed in either direction |
| Deploy | Vercel (`vercel.json`), env vars for Resend/OpenAI | New env vars documented in `.env.example` |

## 2. Implementation plan (all steps done)

1. ✅ Inspect repo, isolate website (route groups), upgrade Next patch version
2. ✅ Database migrations: schema, constraints, indexes, RLS, audit trigger, RPC functions (`supabase/migrations/`)
3. ✅ Auth (invite-only, password + reset), middleware session refresh, app shell (mobile tab bar / desktop sidebar), light/dark
4. ✅ Customers (search, duplicate detection, service locations, archive) and jobs (status workflow, assignments)
5. ✅ Work reports (mobile form, offline-safe saving, submit/review/correct) and centralized time tracking
6. ✅ Office dashboard, calendar (week/day), time overview (week/month), employees, absences, user access
7. ✅ Server-side validation (zod) + tests: 27 domain unit tests, 33 database/RLS tests, 26-step end-to-end flow
8. ✅ Production build, PWA (manifest, service worker, icons), seed data, documentation

## 3. Architecture

```
app/(site)/…            public website (unchanged URLs)
app/(ops)/layout.tsx    root layout of the internal app (no website banners/analytics/chat)
app/(ops)/intern/…      pages + server actions ('use server') per feature
components/ui/          shadcn-style primitives (Radix + cva), owned in repo
components/ops/         feature components (report form, job picker, time views …)
lib/ops/domain/         pure business logic: dates/TZ, holidays, time analysis, labels, audit summaries
lib/ops/validation/     zod schemas – every server action validates input
lib/ops/data/           server-side read queries (RLS-scoped user session)
lib/ops/exports/        format-neutral read model for future exports (read-only)
supabase/migrations/    schema + RLS + functions (source of truth)
supabase/seed.sql       fictional German demo data (local only)
tests/unit|db|e2e       vitest (domain), vitest + PGlite (DB/RLS), Playwright (MVP flow)
```

### Key decisions

**ADR-1 – One app, isolated route group.** The internal app shares the repo and Vercel project with the website (one
deployment, shared tooling) but has its own root layout, CSS and Tailwind config. Middleware only matches `/intern/*`.
A subdomain (`intern.haustechnik-frey.de`) can later be mapped via a Vercel rewrite without code changes.
Two Tailwind configurations coexist, so **the stylesheets are built separately**: the website uses `tailwind.config.ts`
through Next's normal pipeline (and explicitly excludes the ops folders); the platform uses `tailwind.ops.config.ts` and
is pre-built to `app/(ops)/ops.generated.css` by `npm run build:ops-css` (runs automatically in `predev`/`prebuild`;
`npm run dev:ops-css` watches while developing). Do **not** use `@config` inside a CSS file imported by Next – it leaks
into every stylesheet of the build (this broke the website's colours for a few hours on 25.11.2026). `postbuild`
(`scripts/check-site-css.cjs`) fails the build if the website's brand classes disappear. `vercel.json` pins
`buildCommand: npm run build` so these steps always run.

**ADR-2 – Permissions live in Postgres.** Every table has RLS. UI visibility is convenience only.
Visibility helpers (`ist_buero()`, `darf_auftrag_sehen()`, `darf_bericht_sehen()` …) are `SECURITY DEFINER` to avoid policy
recursion. `anon` has no table or function privileges at all.

| | Admin | Office | Employee | Logged in, no role |
|---|---|---|---|---|
| Customers | all | all, edit, archive | own-created + customers of assigned jobs; create | – |
| Jobs | all | all, edit, assign, status | assigned or own-created; create (auto-assigned) | – |
| Work reports | all, review, correct | all, review, correct (reason required after approval) | own + where participant + assigned jobs; edit own drafts / correction requests | – |
| Time entries | all | all (manual) | own; colleagues only via shared reports | – |
| Employees | all | all | own record; colleague **names** via `mitarbeiter_verzeichnis()` (no contract data) | – |
| Absences | all | manage | own (read) | – |
| Audit log | read | read | – | – |
| Roles / invites | yes | – | – | – |

Multiple roles per user (`benutzerprofile.roles app_rolle[]`), e.g. owner = admin + office + employee. Employment role
(Meister/Geselle/…) is a separate attribute of `mitarbeiter`. New auth users get an empty role set (no access) until an
admin assigns roles; the last active admin cannot be removed.

**ADR-3 – Single source of truth for working hours.** Durations exist only in `zeiteintraege` (integer minutes).
Reports link to them via `arbeitsbericht_zeiteintraege` with `UNIQUE(time_entry_id)` and `PRIMARY KEY(work_report_id,
employee_id)` – the database itself makes duplicates impossible. All report writes go through one transactional RPC,
`arbeitsbericht_speichern(jsonb)`, which upserts the report, its activities/materials, and **updates** existing time entries per
participant (removes entries of removed participants). Customer work (`kundenarbeit`) can only be created through
reports; report-linked entries cannot be edited directly (RLS), only via the report → always traceable.

**ADR-4 – Reliable saving on poor mobile networks.**
- Report IDs are generated client-side; each save carries a `mutation_id`. A retried request with the same id is
  detected (`last_mutation_id`) and not applied twice.
- Optimistic locking via `version`; on conflict the client checks whether the winning write was its own lost request
  and transparently retries, otherwise shows "Konflikt – bitte neu laden".
- Form state is mirrored to `localStorage` on every change and offered for restore after reload/crash; cleared after
  a confirmed save. Explicit states: *Ungespeichert / Speichert … / Gespeichert HH:MM / Offline – lokal gesichert*.
- Leaving with unsaved changes triggers a browser warning.
- The service worker caches **no personal data** (only hashed build assets + an offline page).

**ADR-5 – Corrections are traceable.** A generic trigger writes old/new row snapshots, actor and an optional reason
(`app.change_reason`, set inside the RPCs) to `aenderungsprotokoll` for all business tables. Approved reports can only be changed
by office/admin with a mandatory reason; the report page shows a human-readable history ("Arbeitszeit Lena Schmid:
1:45 h → 1:30 h, Begründung …").

**ADR-6 – Archive instead of delete.** No delete policies on customers, jobs, reports, employees. Customers/jobs/
locations have `archived_at`; employees have `is_active`/`end_date`. Only unsubmitted drafts can be discarded.

**ADR-6b – German database names (25.11.2026).** Tables, the view, functions, sequences and enum types carry German
names (`kunden`, `fehlzeiten`, `arbeitsberichte`, …) because the business works in German and reads the data in the
Supabase dashboard. **Column names stay English** (`first_name`, `status`, …): they are mixed with generic UI words in
hundreds of places in the code, so a rename would be risky; it can be done later with a dedicated, fully tested step.

**ADR-6c – The company logo is the original artwork (26.11.2026).** `Images/Logo/Logo.png` is the master (it was the
template for the vehicle lettering). The website used to draw a hand-made imitation in `components/Logo.tsx` (first
commit); it is replaced by `public/logo-mark.svg`, a vector trace of the PNG (`scripts/logo/trace_logo.py`, potrace;
fidelity ≈ 98 % of pixels identical, colours taken from the file: frame #59166C, flame #E9A600, drop #646DC1). The frame
is dark purple, so the logo sits on a white badge on dark backgrounds (`Logo` prop `badge`, default on). Favicon, app
icons (`public/intern/icons`) and the offline page use the same artwork. Request a vector file from the sign maker when
possible and replace `logo-mark.svg` with it.

**ADR-7 – Time & dates.** Business dates are `date` in Europe/Berlin; instants are `timestamptz` (UTC). Conversion is
done server-side (`berlinLocalToUtc`), DST-safe and tested. A DB check enforces `duration = end − start − break` when a
span is given. Baden-Württemberg public holidays are computed (no table needed).

**ADR-7b – Work day (attendance) vs. job allocation (added 25.11.2026).** Requirement from the office: the monthly
timesheet ("Stundenzettel", one Excel sheet per month, one block per employee, columns Kalendertag / Beginn / Pause /
Ende / Dauer / * / aufgezeichnet am / Bemerkungen) must be produced without chasing employees for their hours.
`arbeitstage` stores one start/end/break per employee and day (unique), pre-filled with the usual schedule
(Mo–Do 7:30–16:00, Fr 7:30–13:30) so employees confirm with one tap. This is the **payroll time**. Report time entries
remain the **allocation to jobs** (billing); unallocated work-day time counts as travel/other. Checks: no work day on a
past workday → reminder; report hours exceed the work day → warning. "aufgezeichnet am" is the creation date of the
work day. Remarks are generated from the day's reports ("Kundenname Ortskürzel", e.g. "Girbach UL"; abbreviations
maintained by the office, unknown towns written out), manual entries (Lager, Material, notes like "TÜV") and absences
("Schule", "Urlaub", "Krank" – red). `/intern/zeiten/stundenzettel` shows the month and downloads an `.xlsx` in the
same layout (real Excel time values, one employee per printed A4 page).

**ADR-7c – Berufsschule as a work-day variant (added 26.11.2026).** Apprentices record school days themselves with one tap ("Heute Berufsschule · 8 Std.") on the work-day card: a flat 8 hours (07:30–15:30, no break, no notes; enforced server-side, constant `BERUFSSCHULTAG`). Stored as `arbeitstage.berufsschule` (boolean) instead of a new time-entry type: school hours count as working time, need no work report, appear as "Schule" on the timesheet and as "Berufsschule" (no problem) in the submission check. The office-managed absence type `berufsschule` still exists (planning of block weeks); an apprentice can additionally record the hours on such a day without triggering the absence-with-time warning. Only employees with role `auszubildender` (or the office) may set the flag (enforced in `saveWorkDay`).

**ADR-8 – Job photos (added 26.11.2026).** Employees attach photos to a job (phases: Bestand, Rohinstallation, Heizungsanlage, Fertigmontage, Inbetriebnahme, Sonstiges) from the job page and the report form, so later crews (e.g. final assembly) can see where pipes run. Files live in the private Supabase Storage bucket `auftragsfotos` (`<job-id>/<photo-id>.jpg` + `_t.jpg` thumbnail), metadata in `auftragsfotos`. Visibility = everyone who may see the job (`darf_auftrag_sehen`): assigned employees and the office; the office must assign the final-assembly crew to the job. Photos are downscaled in the browser (long edge 1600 px, thumbnail 400 px, JPEG), so ~0.2–0.5 MB per photo → roughly 2,000–4,000 photos per GB of the free tier (1 GB). Viewing uses 1-hour signed URLs. Delete: creator or office. **Known gap:** the daily GitHub backup covers the database only, not the photo files; deleting a job's photos is irreversible.

**ADR-9 – Deleting jobs (added 27.11.2026).** Mistakenly created jobs can be erased completely via the checked database function `auftrag_loeschen` (preview: `auftrag_loeschvorschau`). Office/admin may delete any job except billed ones (`abgerechnet`, archive instead); an employee only a job they created themselves with no reports, time entries or photos. Deleting removes the job's reports, time entries (their hours disappear; automatic work days adjust, manual work days stay) and photo rows; the app then deletes the photo files from storage. The UI shows exactly what disappears and requires typing LÖSCHEN when anything is attached. The change log keeps the DELETE records (reason "Auftrag gelöscht").

**ADR-8 – Daily consistency checks are hints, not rules.** Flags: overlapping spans (error), missing times on past
regular workdays (warning), absence with work time, > 10 h/day, break hint following ArbZG §4 thresholds (info),
unsubmitted reports. **No** overtime, vacation balance or payroll calculation.

**ADR-9 – Materials are snapshots.** Material positions always store description/quantity/unit/manufacturer/article
numbers, even when later linked to a catalog article (`catalog_article_id` → `katalogartikel`, prepared for KLOWA,
`UNIQUE(source, external_id)`). Catalog changes never alter historical reports.

**ADR-10 – Exports are separate, read-only consumers.** `lib/ops/exports/approved-records.ts` provides a
format-neutral model of **approved** reports (customer incl. Edison number, activities, materials, labour minutes).
No UGL/Excel format is generated until real specs/sample files exist.

**ADR-11 – No external AI or tracking in the internal app.** The website's analytics, speed insights and AI chat are
not loaded under `/intern`; `/intern` is `noindex` and disallowed in `robots.txt`.

## 4. Data model (summary)

| Tabelle | Inhalt |
|---|---|
| `benutzerprofile` | 1:1 zu `auth.users`, `roles[]` (Zugriffsrollen), aktiv/inaktiv |
| `mitarbeiter` | Personalnummer, Beschäftigungsart, Eintritt/Austritt, Wochen-Soll (Minuten), Urlaubsanspruch, optional `profile_id` |
| `kunden` | Nummer `K-…`, optionale Edison-Nummer, Rechnungsadresse, Kurzname, generierter `search_text` + Trigram-Index |
| `einsatzorte` | n je Kunde |
| `auftraege` | Nummer `A-…`, zusammengesetzter FK stellt sicher, dass der Einsatzort zum Kunden gehört; Kategorie, Status |
| `auftragszuweisungen` | Mitarbeiter ↔ Auftrag |
| `arbeitsberichte` | Nummer `B-…`, Status, Version, Mutations-ID, Prüffelder |
| `arbeitsbericht_taetigkeiten`, `arbeitsbericht_material` | Positionen des Berichts |
| `zeiteintraege` | einzige Quelle für Stunden je Auftrag/Tätigkeit |
| `arbeitsbericht_zeiteintraege` | Verknüpfung Bericht ↔ Zeiteintrag (eindeutig) |
| `arbeitstage` | Beginn/Ende/Pause je Mitarbeiter und Tag (Lohn-/Stundenzettel-Grundlage) |
| `fehlzeiten` | Urlaub, Krank, Berufsschule …, tageweise, halbe Tage |
| `ortskuerzel` | Ortskürzel für die Bemerkungen im Stundenzettel |
| `katalogartikel` | leer, vorbereitet für KLOWA |
| `aenderungsprotokoll` | Audit-Log (nur lesbar für Büro/Admin) |
| Ansicht `mitarbeiter_tagesminuten` | security-invoker, für späteren Lohn-Export |

Funktionen (RPC): `arbeitsbericht_speichern`, `arbeitsbericht_pruefen`, `arbeitsbericht_entwurf_loeschen`,
`kunden_dubletten_finden`, `mitarbeiter_verzeichnis`, `zugang_setzen`; Berechtigungs-Helfer `ist_admin`, `ist_buero`,
`ist_mitglied`, `hat_rolle`, `aktuelle_mitarbeiter_id`, `darf_auftrag_sehen`, `darf_kunde_sehen`, `darf_bericht_sehen`.

Statuses – Job: Geplant → In Bearbeitung (auto on first report) → Abgeschlossen → Abrechnungsbereit → Abgerechnet.
Report: Entwurf → Eingereicht → Freigegeben, or → Korrektur erforderlich → (edit) → Eingereicht.

## 5. Running locally

```bash
npm install
npx supabase start            # Docker required; prints URL + keys
npx supabase db reset         # migrations + fictional seed data
cp .env.example .env.local    # fill NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
npm run dev                   # http://localhost:3000/intern
```

Demo logins (local seed only, password `Frey-Demo-2026!`): `andreas.frey@frey-demo.test` (admin+office+employee),
`sabine.frey@frey-demo.test` (office), `jonas.keller@`, `lukas.brenner@`, `tobias.maier@frey-demo.test` (employees).
Invitation e-mails are visible in Mailpit at http://127.0.0.1:54324.

## 6. Tests

| Command | What |
|---|---|
| `npm test` | Domain unit tests + **database tests on an in-process Postgres (PGlite)** with a Supabase shim: report↔time-entry sync never duplicates (create, edit, replay, submit, approve, correct, remove participant, discard), and authorization per role (anon, no role, employee, office, admin, deactivated user) |
| `npm run test:e2e` | Playwright flow against local Supabase + `npm start`: all MVP acceptance criteria for employee (mobile) and office (desktop) including DB assertions on time entries and audit log |
| `npm run typecheck`, `npm run build` | Type safety and production build |

## 7. Deployment checklist

1. **Supabase project** (Free plan, region Frankfurt). Link and push migrations: `npx supabase link --project-ref …`,
   `npx supabase db push`. **Do not run `seed.sql` in production.**
2. **Auth settings:** disable "Allow new users to sign up"; Site URL `https://haustechnik-frey.de/intern`; redirect URL
   `https://haustechnik-frey.de/intern/auth/confirm`; minimum password length 10; copy the German templates from
   `supabase/templates/` (invite, recovery); configure custom SMTP with the existing Resend account
   (`smtp.resend.com`, port 465, user `resend`, password = Resend API key) – required on the free plan.
3. **Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all environments),
   `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`).
4. **First admin:** invite yourself from the Supabase dashboard, then set roles once via SQL:
   `update benutzerprofile set roles='{admin,office,employee}' where email='…';` and link the employee record. All further
   users are invited from `/intern/benutzer`.
5. **Backups:** set the two GitHub secrets from §8 and run the backup workflow once.
6. Verify: `/intern` redirects to login; website pages unchanged; install the PWA on one Android and one iPhone.

**Hosting decision (25.11.2026):** Supabase (region Frankfurt, `eu-central-1`) as the only data store; Vercel
serverless functions pinned to Frankfurt (`vercel.json` → `regions: ["fra1"]`) so database round-trips stay short.
A US provider with EU data residency was accepted by the business; the standard DPA (AVV) is still signed in both
dashboards as a formality.

## 8. Running costs & backup strategy

**Goal: no additional monthly cost.** Decision 25.11.2026.

| Component | Plan | Cost | Limits / notes |
|---|---|---|---|
| Database, auth | Supabase **Free**, region Frankfurt | 0 € | 500 MB DB (estimate: ~50 MB/year at 10 employees), 50k monthly users; **no restorable Supabase backups**; project pauses after 7 days without any activity (unpause with one click, data is kept) |
| App hosting | Same Vercel project as the website | 0 € extra | Note: Vercel's free Hobby plan is for non-commercial use only – applies to the website already |
| Invitation / password e-mails | Existing Resend account as custom SMTP | 0 € (free tier) | Supabase's built-in mailer only delivers to project team members, so custom SMTP is required |
| Backups | GitHub Actions, daily, encrypted | 0 € | 90 days retention as workflow artifacts |

**Backup (`.github/workflows/db-backup.yml`, `scripts/backup-db.sh`):** daily dump of roles, schema and data
(`public` + `auth`, i.e. including logins) using the Supabase CLI, AES-256 encrypted with a passphrase **before**
upload. Necessary because the repository is public. Setup:
1. GitHub → Settings → Secrets → Actions: `SUPABASE_DB_URL` (Supabase → Connect → **Session pooler** string, port 5432;
   the direct connection is IPv6-only and does not work from GitHub runners) and `BACKUP_PASSPHRASE` (long random
   passphrase, also stored offline – without it backups are useless).
2. Scheduled workflows only run from the default branch, i.e. after merging to `master`. Trigger once manually
   ("Run workflow") and check the artifact.
3. Once a month, download one artifact and keep it offline (USB drive/NAS) for long-term retention.

**Restore (`scripts/restore-db.sh`), tested 25.11.2026:** backup → wipe → restore on the local stack reproduced all
row counts exactly (customers, reports, time entries, links, audit log, auth users, roles); logins worked and number
sequences continued correctly; a wrong passphrase aborts. Procedure for an emergency: new Supabase project →
`supabase db push` (migrations) → `RESTORE_DB_URL=… BACKUP_PASSPHRASE=… scripts/restore-db.sh <file> --data-only` →
update Vercel env vars. Repeat the drill quarterly.

**When to upgrade to Supabase Pro (~25 $/month):** when photos/signatures are added (storage beyond 1 GB), when the
pause risk over holidays is unacceptable, or when Supabase-managed backups / point-in-time recovery are wanted.
Storage files (future photos) are **not** covered by the current database backup.

## 9. Unresolved requirements / questions for the business

1. **Stundenzettel details** – decided 25.11.2026: breaks are not deducted (default 0, no break hint); long company
   names are shortened (optional `kunden.short_name`, otherwise legal form removed). Open: meaning of the "*" column
   (left empty in the export).
1a. **Payroll & overtime rules** – how are vacation, sickness, vocational school and holidays credited (hours per day?),
   overtime thresholds, rounding? Nothing is calculated until confirmed. Weekly target is stored as master data only.
2. **Travel time in reports** – should travel be captured per participant inside the report (currently recorded
   separately in "Meine Zeiten", optionally billable with a job)? Data model is ready to extend.
3. **Time-entry lock** – after which point may employees no longer edit their manual entries (e.g. after month end or
   office approval of a period)? Currently editable until deleted/changed by office.
4. **Customer visibility for employees** – employees see customers of their jobs plus minimal duplicate matches
   (name, place, locations). Confirm this privacy trade-off or allow full customer search for field staff.
5. **Edison Handwerk** – UGL version/sample files and which fields Edison expects (customer number mapping, material
   article numbers, labour items) before building the export.
6. **KLOWA catalog** – file format, update frequency, licensing of supplier data.
7. **Existing digital Aufmaß workflow** – which tool, which format, at which job stage.
8. **Signatures & photos** – legal requirement for customer signatures on reports? Storage/retention for photos.
9. **Retention & GDPR** – deletion periods for customer data and employee time records; data processing agreement
   with Supabase/Vercel (EU region).
10. **Holidays** – only Baden-Württemberg statutory holidays are applied; company holidays (e.g. 24./31.12.) to be
    entered as absences or added as a rule.

## 10. Future extensions (prepared, not built)

Photos & signatures (Supabase Storage, per-report bucket with RLS) · AI voice-to-report (only after a DPA/EU-hosted
model decision; report payload is already structured JSON) · catalog search in the material editor · payroll Excel
export from `mitarbeiter_tagesminuten` · Edison UGL export from `ApprovedWorkRecord` · vacation requests by employees ·
background sync of offline drafts (current approach: local safeguard + explicit retry).
