-- Frey Haustechnik – Betriebsplattform: Kernschema
-- Zeitzone für alle fachlichen Datumsangaben: Europe/Berlin.
-- Dauern werden ausschließlich als ganze Minuten (integer) gespeichert.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'office', 'employee');

create type public.employment_role as enum ('meister', 'geselle', 'auszubildender', 'helfer', 'buero');

create type public.job_status as enum ('geplant', 'in_bearbeitung', 'abgeschlossen', 'abrechnungsbereit', 'abgerechnet');

create type public.job_category as enum (
  'kundendienst', 'wartung', 'reparatur', 'sanitaer', 'heizung', 'waermepumpe',
  'badsanierung', 'lueftung', 'solar', 'sonstiges'
);

create type public.report_status as enum ('entwurf', 'eingereicht', 'freigegeben', 'korrektur_erforderlich');

create type public.time_entry_type as enum (
  'kundenarbeit', 'fahrzeit', 'materialbeschaffung', 'lager', 'intern', 'pause'
);

create type public.absence_type as enum ('urlaub', 'krank', 'berufsschule', 'feiertag', 'sonstiges');

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profile (1:1 zu auth.users) und Berechtigungen
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  roles public.app_role[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Neue Auth-Benutzer erhalten ein Profil OHNE Rollen. Rollen vergibt nur ein Admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Mitarbeiter (Beschäftigungsrolle getrennt von Software-Berechtigung)
-- ---------------------------------------------------------------------------
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  employee_number text not null unique,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  employment_role public.employment_role not null,
  is_active boolean not null default true,
  start_date date not null,
  end_date date,
  weekly_target_minutes integer not null default 2400 check (weekly_target_minutes between 0 and 4200),
  annual_vacation_days numeric(4, 1) not null default 30 check (annual_vacation_days between 0 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_dates_valid check (end_date is null or end_date >= start_date)
);

create index employees_active_idx on public.employees (is_active, last_name);

create trigger employees_updated_at before update on public.employees
  for each row execute function public.set_updated_at();

-- Rollen-Helfer: SECURITY DEFINER, damit sie in RLS-Policies ohne Rekursion nutzbar sind.
create or replace function public.has_role(required public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and required = any (p.roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_office()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.roles && array['admin', 'office']::public.app_role[]
  );
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id
  from public.employees e
  join public.profiles p on p.id = e.profile_id
  where e.profile_id = auth.uid() and e.is_active and p.is_active
    and 'employee' = any (p.roles);
$$;

-- ---------------------------------------------------------------------------
-- Kunden & Einsatzorte
-- ---------------------------------------------------------------------------
create sequence public.customer_number_seq start 10001;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_number integer not null unique default nextval('public.customer_number_seq'),
  edison_customer_number text unique,
  first_name text,
  last_name text,
  company_name text,
  billing_street text,
  billing_postal_code text,
  billing_city text,
  phone text,
  email text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  search_text text generated always as (
    lower(
      coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company_name, '') || ' ' ||
      coalesce(billing_city, '') || ' ' || coalesce(billing_street, '') || ' ' || coalesce(email, '') || ' ' ||
      regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') || ' ' || coalesce(edison_customer_number, '') || ' ' ||
      customer_number::text
    )
  ) stored,
  phone_digits text generated always as (nullif(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '')) stored,
  constraint customers_name_required check (
    nullif(trim(coalesce(last_name, '')), '') is not null or nullif(trim(coalesce(company_name, '')), '') is not null
  ),
  constraint customers_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint customers_postal_code_format check (billing_postal_code is null or billing_postal_code ~ '^[0-9]{5}$')
);

alter sequence public.customer_number_seq owned by public.customers.customer_number;

create index customers_search_trgm_idx on public.customers using gin (search_text extensions.gin_trgm_ops);
create index customers_last_name_idx on public.customers (lower(last_name));
create index customers_phone_digits_idx on public.customers (phone_digits);
create index customers_email_idx on public.customers (lower(email));
create index customers_active_idx on public.customers (archived_at) where archived_at is null;

create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.service_locations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  label text,
  street text not null check (length(trim(street)) > 0),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  city text not null check (length(trim(city)) > 0),
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  -- ermöglicht zusammengesetzten Fremdschlüssel (Auftrag ↔ Einsatzort desselben Kunden)
  unique (id, customer_id)
);

create index service_locations_customer_idx on public.service_locations (customer_id);

create trigger service_locations_updated_at before update on public.service_locations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Aufträge (kleiner Kundendienst und Großprojekt im selben Modell)
-- ---------------------------------------------------------------------------
create sequence public.job_number_seq start 20001;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_number integer not null unique default nextval('public.job_number_seq'),
  customer_id uuid not null references public.customers (id) on delete restrict,
  service_location_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  description text,
  category public.job_category not null default 'sonstiges',
  status public.job_status not null default 'geplant',
  start_date date not null default (now() at time zone 'Europe/Berlin')::date,
  completion_date date,
  notes text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  foreign key (service_location_id, customer_id) references public.service_locations (id, customer_id),
  constraint jobs_dates_valid check (completion_date is null or completion_date >= start_date)
);

alter sequence public.job_number_seq owned by public.jobs.job_number;

create index jobs_customer_idx on public.jobs (customer_id);
create index jobs_status_idx on public.jobs (status) where archived_at is null;
create index jobs_start_date_idx on public.jobs (start_date);
create index jobs_title_trgm_idx on public.jobs using gin (lower(title) extensions.gin_trgm_ops);

create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

create table public.job_assignments (
  job_id uuid not null references public.jobs (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null default auth.uid(),
  assigned_at timestamptz not null default now(),
  primary key (job_id, employee_id)
);

create index job_assignments_employee_idx on public.job_assignments (employee_id);

-- Wer einen Auftrag anlegt und selbst Mitarbeiter ist, wird automatisch zugewiesen.
create or replace function public.assign_job_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee uuid := public.current_employee_id();
begin
  if v_employee is not null then
    insert into public.job_assignments (job_id, employee_id)
    values (new.id, v_employee)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger jobs_assign_creator after insert on public.jobs
  for each row execute function public.assign_job_creator();

-- ---------------------------------------------------------------------------
-- Artikelkatalog (Vorbereitung KLOWA – bewusst noch ohne Import)
-- ---------------------------------------------------------------------------
create table public.catalog_articles (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  description text not null,
  unit text,
  manufacturer text,
  article_number text,
  supplier_article_number text,
  raw jsonb,
  imported_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (source, external_id)
);

-- ---------------------------------------------------------------------------
-- Arbeitsberichte
-- ---------------------------------------------------------------------------
create sequence public.report_number_seq start 30001;

create table public.work_reports (
  id uuid primary key default gen_random_uuid(),
  report_number integer not null unique default nextval('public.report_number_seq'),
  job_id uuid not null references public.jobs (id) on delete restrict,
  report_date date not null,
  status public.report_status not null default 'entwurf',
  internal_notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_comment text,
  -- Optimistische Sperre: jede Änderung erhöht die Version.
  version integer not null default 1 check (version > 0),
  -- Idempotenz: Wiederholte Speicher-Anfragen (z. B. nach Netzabbruch) werden erkannt.
  last_mutation_id uuid
);

alter sequence public.report_number_seq owned by public.work_reports.report_number;

create index work_reports_job_idx on public.work_reports (job_id);
create index work_reports_date_idx on public.work_reports (report_date);
create index work_reports_status_idx on public.work_reports (status, report_date);
create index work_reports_created_by_idx on public.work_reports (created_by);

create trigger work_reports_updated_at before update on public.work_reports
  for each row execute function public.set_updated_at();

create table public.work_report_activities (
  id uuid primary key default gen_random_uuid(),
  work_report_id uuid not null references public.work_reports (id) on delete cascade,
  position integer not null check (position >= 0),
  description text not null check (length(trim(description)) between 1 and 1000),
  unique (work_report_id, position) deferrable initially deferred
);

create table public.work_report_materials (
  id uuid primary key default gen_random_uuid(),
  work_report_id uuid not null references public.work_reports (id) on delete cascade,
  position integer not null check (position >= 0),
  catalog_article_id uuid references public.catalog_articles (id) on delete restrict,
  -- Positionsdaten werden immer als Momentaufnahme gespeichert (auch bei Katalogbezug).
  description text not null check (length(trim(description)) between 1 and 500),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) between 1 and 20),
  manufacturer text,
  article_number text,
  supplier_article_number text,
  supplier_reference text,
  unique (work_report_id, position) deferrable initially deferred
);

create index work_report_materials_catalog_idx on public.work_report_materials (catalog_article_id)
  where catalog_article_id is not null;

-- ---------------------------------------------------------------------------
-- Zeiterfassung: EINZIGE Quelle für Arbeitszeiten
-- ---------------------------------------------------------------------------
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  entry_date date not null,
  entry_type public.time_entry_type not null,
  job_id uuid references public.jobs (id) on delete restrict,
  started_at timestamptz,
  ended_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  duration_minutes integer not null check (duration_minutes between 0 and 1440),
  billable boolean not null default false,
  note text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, employee_id),
  constraint time_entries_start_end_pair check ((started_at is null) = (ended_at is null)),
  constraint time_entries_end_after_start check (ended_at is null or ended_at > started_at),
  constraint time_entries_max_span check (ended_at is null or ended_at - started_at <= interval '24 hours'),
  constraint time_entries_start_on_entry_date check (
    started_at is null or (started_at at time zone 'Europe/Berlin')::date = entry_date
  ),
  -- Bei Von/Bis-Angabe muss die Dauer exakt (Ende − Beginn − Pause) entsprechen.
  constraint time_entries_duration_matches check (
    started_at is null
    or duration_minutes = (extract(epoch from (ended_at - started_at))::integer / 60) - break_minutes
  ),
  constraint time_entries_billable_requires_job check (not billable or job_id is not null),
  constraint time_entries_billable_type check (not billable or entry_type in ('kundenarbeit', 'fahrzeit')),
  constraint time_entries_break_no_job check (entry_type <> 'pause' or (job_id is null and not billable and break_minutes = 0)),
  constraint time_entries_customer_work_job check (entry_type <> 'kundenarbeit' or job_id is not null)
);

create index time_entries_employee_date_idx on public.time_entries (employee_id, entry_date);
create index time_entries_date_idx on public.time_entries (entry_date);
create index time_entries_job_idx on public.time_entries (job_id) where job_id is not null;

create trigger time_entries_updated_at before update on public.time_entries
  for each row execute function public.set_updated_at();

-- Verknüpfung Bericht ↔ Zeiteintrag. Pro Bericht und Mitarbeiter genau EIN Eintrag,
-- jeder Zeiteintrag gehört höchstens zu EINEM Bericht → keine Duplikate möglich.
create table public.work_report_time_entries (
  work_report_id uuid not null references public.work_reports (id) on delete restrict,
  time_entry_id uuid not null unique,
  employee_id uuid not null,
  primary key (work_report_id, employee_id),
  foreign key (time_entry_id, employee_id) references public.time_entries (id, employee_id)
);

create index work_report_time_entries_employee_idx on public.work_report_time_entries (employee_id);

-- ---------------------------------------------------------------------------
-- Abwesenheiten (tageweise; keine Verrechnungsregeln hinterlegt)
-- ---------------------------------------------------------------------------
create table public.employee_absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  absence_type public.absence_type not null,
  start_date date not null,
  end_date date not null,
  half_day boolean not null default false,
  note text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_absences_dates_valid check (end_date >= start_date),
  constraint employee_absences_half_day_single check (not half_day or start_date = end_date)
);

create index employee_absences_employee_idx on public.employee_absences (employee_id, start_date, end_date);

create trigger employee_absences_updated_at before update on public.employee_absences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit-Log
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  reason text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create index audit_logs_record_idx on public.audit_logs (table_name, record_id, changed_at desc);
create index audit_logs_changed_at_idx on public.audit_logs (changed_at desc);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id text;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;

  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then
    return new;
  end if;

  v_id := coalesce(v_new, v_old) ->> 'id';
  if v_id is null then
    v_id := concat_ws(':',
      coalesce(v_new, v_old) ->> 'work_report_id',
      coalesce(v_new, v_old) ->> 'job_id',
      coalesce(v_new, v_old) ->> 'employee_id');
  end if;

  insert into public.audit_logs (table_name, record_id, action, actor_id, reason, old_data, new_data)
  values (tg_table_name, v_id, tg_op, auth.uid(),
          nullif(current_setting('app.change_reason', true), ''), v_old, v_new);

  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'employees', 'customers', 'service_locations', 'jobs', 'job_assignments',
    'work_reports', 'work_report_activities', 'work_report_materials', 'time_entries',
    'work_report_time_entries', 'employee_absences'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit_log()',
      t || '_audit', t);
  end loop;
end;
$$;
