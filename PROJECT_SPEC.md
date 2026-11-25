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

**ADR-2 – Permissions live in Postgres.** Every table has RLS. UI visibility is convenience only.
Visibility helpers (`is_office()`, `can_view_job()`, `can_view_report()` …) are `SECURITY DEFINER` to avoid policy
recursion. `anon` has no table or function privileges at all.

| | Admin | Office | Employee | Logged in, no role |
|---|---|---|---|---|
| Customers | all | all, edit, archive | own-created + customers of assigned jobs; create | – |
| Jobs | all | all, edit, assign, status | assigned or own-created; create (auto-assigned) | – |
| Work reports | all, review, correct | all, review, correct (reason required after approval) | own + where participant + assigned jobs; edit own drafts / correction requests | – |
| Time entries | all | all (manual) | own; colleagues only via shared reports | – |
| Employees | all | all | own record; colleague **names** via `employee_directory()` (no contract data) | – |
| Absences | all | manage | own (read) | – |
| Audit log | read | read | – | – |
| Roles / invites | yes | – | – | – |

Multiple roles per user (`profiles.roles app_role[]`), e.g. owner = admin + office + employee. Employment role
(Meister/Geselle/…) is a separate attribute of `employees`. New auth users get an empty role set (no access) until an
admin assigns roles; the last active admin cannot be removed.

**ADR-3 – Single source of truth for working hours.** Durations exist only in `time_entries` (integer minutes).
Reports link to them via `work_report_time_entries` with `UNIQUE(time_entry_id)` and `PRIMARY KEY(work_report_id,
employee_id)` – the database itself makes duplicates impossible. All report writes go through one transactional RPC,
`save_work_report(jsonb)`, which upserts the report, its activities/materials, and **updates** existing time entries per
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
(`app.change_reason`, set inside the RPCs) to `audit_logs` for all business tables. Approved reports can only be changed
by office/admin with a mandatory reason; the report page shows a human-readable history ("Arbeitszeit Lena Schmid:
1:45 h → 1:30 h, Begründung …").

**ADR-6 – Archive instead of delete.** No delete policies on customers, jobs, reports, employees. Customers/jobs/
locations have `archived_at`; employees have `is_active`/`end_date`. Only unsubmitted drafts can be discarded.

**ADR-7 – Time & dates.** Business dates are `date` in Europe/Berlin; instants are `timestamptz` (UTC). Conversion is
done server-side (`berlinLocalToUtc`), DST-safe and tested. A DB check enforces `duration = end − start − break` when a
span is given. Baden-Württemberg public holidays are computed (no table needed).

**ADR-8 – Daily consistency checks are hints, not rules.** Flags: overlapping spans (error), missing times on past
regular workdays (warning), absence with work time, > 10 h/day, break hint following ArbZG §4 thresholds (info),
unsubmitted reports. **No** overtime, vacation balance or payroll calculation.

**ADR-9 – Materials are snapshots.** Material positions always store description/quantity/unit/manufacturer/article
numbers, even when later linked to a catalog article (`catalog_article_id` → `catalog_articles`, prepared for KLOWA,
`UNIQUE(source, external_id)`). Catalog changes never alter historical reports.

**ADR-10 – Exports are separate, read-only consumers.** `lib/ops/exports/approved-records.ts` provides a
format-neutral model of **approved** reports (customer incl. Edison number, activities, materials, labour minutes).
No UGL/Excel format is generated until real specs/sample files exist.

**ADR-11 – No external AI or tracking in the internal app.** The website's analytics, speed insights and AI chat are
not loaded under `/intern`; `/intern` is `noindex` and disallowed in `robots.txt`.

## 4. Data model (summary)

`profiles` (1:1 auth.users, roles[]) · `employees` (number, employment role, start/end, weekly target minutes,
vacation days, optional `profile_id`) · `customers` (number `K-…`, optional Edison number, billing address, generated
`search_text` + trigram index, `phone_digits`) · `service_locations` (n per customer) · `jobs` (number `A-…`, composite FK
ensures the location belongs to the job's customer, category, status) · `job_assignments` · `work_reports` (number `B-…`,
status, version, mutation id, review fields) · `work_report_activities` · `work_report_materials` · `time_entries` ·
`work_report_time_entries` · `employee_absences` (day-based, half day) · `catalog_articles` (empty, prepared) ·
`audit_logs` · view `employee_daily_minutes` (security-invoker) for future payroll export.

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

1. **Supabase project** (region EU, e.g. Frankfurt). Link and push migrations: `npx supabase link --project-ref …`,
   `npx supabase db push`. **Do not run `seed.sql` in production.**
2. **Auth settings:** disable "Allow new users to sign up"; Site URL `https://haustechnik-frey.de/intern`; redirect URL
   `https://haustechnik-frey.de/intern/auth/confirm`; minimum password length 10; copy the German templates from
   `supabase/templates/` (invite, recovery); configure custom SMTP (e.g. the existing Resend domain) – the built-in
   mailer is rate-limited.
3. **Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all environments),
   `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`).
4. **First admin:** invite yourself from the Supabase dashboard, then set roles once via SQL:
   `update profiles set roles='{admin,office,employee}' where email='…';` and link the employee record. All further
   users are invited from `/intern/benutzer`.
5. Verify: `/intern` redirects to login; website pages unchanged; install the PWA on one Android and one iPhone.

**Hosting decision (25.11.2026):** Supabase (region Frankfurt, `eu-central-1`) as the only data store; Vercel
serverless functions pinned to Frankfurt (`vercel.json` → `regions: ["fra1"]`) so database round-trips stay short.
A US provider with EU data residency was accepted by the business; the standard DPA (AVV) is still signed in both
dashboards as a formality.

## 8. Backup & restore strategy (to be set up before production use)

- **Supabase Pro plan** for daily automated backups (7 days); enable **Point-in-Time Recovery** if the budget allows
  (recommended once reports replace paper).
- **Independent weekly logical backup** (`pg_dump` via GitHub Action or a NAS cron job) to storage outside Supabase,
  encrypted, retention ≥ 12 months; tax-relevant records may need longer retention – confirm with the tax advisor.
- **Restore drill** before go-live and quarterly: restore the latest dump into a fresh Supabase project, run
  `npm test` + e2e against it, document duration.
- Migrations are the schema source of truth (in git); never change production schema via the dashboard.

## 9. Unresolved requirements / questions for the business

1. **Payroll & overtime rules** – how are vacation, sickness, vocational school and holidays credited (hours per day?),
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
export from `employee_daily_minutes` · Edison UGL export from `ApprovedWorkRecord` · vacation requests by employees ·
background sync of offline drafts (current approach: local safeguard + explicit retry).
