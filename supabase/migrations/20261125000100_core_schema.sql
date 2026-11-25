-- Frey Haustechnik – Betriebsplattform: Kernschema
-- Zeitzone für alle fachlichen Datumsangaben: Europe/Berlin.
-- Dauern werden ausschließlich als ganze Minuten (integer) gespeichert.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_rolle as enum ('admin', 'office', 'employee');

create type public.beschaeftigungsart as enum ('meister', 'geselle', 'auszubildender', 'helfer', 'buero');

create type public.auftragsstatus as enum ('geplant', 'in_bearbeitung', 'abgeschlossen', 'abrechnungsbereit', 'abgerechnet');

create type public.auftragskategorie as enum (
  'kundendienst', 'wartung', 'reparatur', 'sanitaer', 'heizung', 'waermepumpe',
  'badsanierung', 'lueftung', 'solar', 'sonstiges'
);

create type public.berichtsstatus as enum ('entwurf', 'eingereicht', 'freigegeben', 'korrektur_erforderlich');

create type public.zeitart as enum (
  'kundenarbeit', 'fahrzeit', 'materialbeschaffung', 'lager', 'intern', 'pause'
);

create type public.fehlzeitart as enum ('urlaub', 'krank', 'berufsschule', 'feiertag', 'sonstiges');

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------
create or replace function public.aktualisiert_am_setzen()
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
create table public.benutzerprofile (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  roles public.app_rolle[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger benutzerprofile_updated_at before update on public.benutzerprofile
  for each row execute function public.aktualisiert_am_setzen();

-- Neue Auth-Benutzer erhalten ein Profil OHNE Rollen. Rollen vergibt nur ein Admin.
create or replace function public.neuen_benutzer_anlegen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.benutzerprofile (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger benutzer_angelegt
  after insert on auth.users
  for each row execute function public.neuen_benutzer_anlegen();

-- ---------------------------------------------------------------------------
-- Mitarbeiter (Beschäftigungsrolle getrennt von Software-Berechtigung)
-- ---------------------------------------------------------------------------
create table public.mitarbeiter (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.benutzerprofile (id) on delete set null,
  employee_number text not null unique,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  employment_role public.beschaeftigungsart not null,
  is_active boolean not null default true,
  start_date date not null,
  end_date date,
  weekly_target_minutes integer not null default 2400 check (weekly_target_minutes between 0 and 4200),
  annual_vacation_days numeric(4, 1) not null default 30 check (annual_vacation_days between 0 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mitarbeiter_dates_valid check (end_date is null or end_date >= start_date)
);

create index mitarbeiter_active_idx on public.mitarbeiter (is_active, last_name);

create trigger mitarbeiter_updated_at before update on public.mitarbeiter
  for each row execute function public.aktualisiert_am_setzen();

-- Rollen-Helfer: SECURITY DEFINER, damit sie in RLS-Policies ohne Rekursion nutzbar sind.
create or replace function public.hat_rolle(required public.app_rolle)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.benutzerprofile p
    where p.id = auth.uid() and p.is_active and required = any (p.roles)
  );
$$;

create or replace function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.hat_rolle('admin');
$$;

create or replace function public.ist_buero()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.benutzerprofile p
    where p.id = auth.uid() and p.is_active and p.roles && array['admin', 'office']::public.app_rolle[]
  );
$$;

create or replace function public.aktuelle_mitarbeiter_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id
  from public.mitarbeiter e
  join public.benutzerprofile p on p.id = e.profile_id
  where e.profile_id = auth.uid() and e.is_active and p.is_active
    and 'employee' = any (p.roles);
$$;

-- ---------------------------------------------------------------------------
-- Kunden & Einsatzorte
-- ---------------------------------------------------------------------------
create sequence public.kundennummer_seq start 10001;

create table public.kunden (
  id uuid primary key default gen_random_uuid(),
  customer_number integer not null unique default nextval('public.kundennummer_seq'),
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
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
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
  constraint kunden_name_required check (
    nullif(trim(coalesce(last_name, '')), '') is not null or nullif(trim(coalesce(company_name, '')), '') is not null
  ),
  constraint kunden_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint kunden_postal_code_format check (billing_postal_code is null or billing_postal_code ~ '^[0-9]{5}$')
);

alter sequence public.kundennummer_seq owned by public.kunden.customer_number;

create index kunden_search_trgm_idx on public.kunden using gin (search_text extensions.gin_trgm_ops);
create index kunden_last_name_idx on public.kunden (lower(last_name));
create index kunden_phone_digits_idx on public.kunden (phone_digits);
create index kunden_email_idx on public.kunden (lower(email));
create index kunden_active_idx on public.kunden (archived_at) where archived_at is null;

create trigger kunden_updated_at before update on public.kunden
  for each row execute function public.aktualisiert_am_setzen();

create table public.einsatzorte (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.kunden (id) on delete restrict,
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

create index einsatzorte_customer_idx on public.einsatzorte (customer_id);

create trigger einsatzorte_updated_at before update on public.einsatzorte
  for each row execute function public.aktualisiert_am_setzen();

-- ---------------------------------------------------------------------------
-- Aufträge (kleiner Kundendienst und Großprojekt im selben Modell)
-- ---------------------------------------------------------------------------
create sequence public.auftragsnummer_seq start 20001;

create table public.auftraege (
  id uuid primary key default gen_random_uuid(),
  job_number integer not null unique default nextval('public.auftragsnummer_seq'),
  customer_id uuid not null references public.kunden (id) on delete restrict,
  service_location_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  description text,
  category public.auftragskategorie not null default 'sonstiges',
  status public.auftragsstatus not null default 'geplant',
  start_date date not null default (now() at time zone 'Europe/Berlin')::date,
  completion_date date,
  notes text,
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  foreign key (service_location_id, customer_id) references public.einsatzorte (id, customer_id),
  constraint auftraege_dates_valid check (completion_date is null or completion_date >= start_date)
);

alter sequence public.auftragsnummer_seq owned by public.auftraege.job_number;

create index auftraege_customer_idx on public.auftraege (customer_id);
create index auftraege_status_idx on public.auftraege (status) where archived_at is null;
create index auftraege_start_date_idx on public.auftraege (start_date);
create index auftraege_title_trgm_idx on public.auftraege using gin (lower(title) extensions.gin_trgm_ops);

create trigger auftraege_updated_at before update on public.auftraege
  for each row execute function public.aktualisiert_am_setzen();

create table public.auftragszuweisungen (
  job_id uuid not null references public.auftraege (id) on delete cascade,
  employee_id uuid not null references public.mitarbeiter (id) on delete restrict,
  assigned_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  assigned_at timestamptz not null default now(),
  primary key (job_id, employee_id)
);

create index auftragszuweisungen_employee_idx on public.auftragszuweisungen (employee_id);

-- Wer einen Auftrag anlegt und selbst Mitarbeiter ist, wird automatisch zugewiesen.
create or replace function public.ersteller_zuweisen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee uuid := public.aktuelle_mitarbeiter_id();
begin
  if v_employee is not null then
    insert into public.auftragszuweisungen (job_id, employee_id)
    values (new.id, v_employee)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger auftraege_ersteller_zuweisen after insert on public.auftraege
  for each row execute function public.ersteller_zuweisen();

-- ---------------------------------------------------------------------------
-- Artikelkatalog (Vorbereitung KLOWA – bewusst noch ohne Import)
-- ---------------------------------------------------------------------------
create table public.katalogartikel (
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
create sequence public.berichtsnummer_seq start 30001;

create table public.arbeitsberichte (
  id uuid primary key default gen_random_uuid(),
  report_number integer not null unique default nextval('public.berichtsnummer_seq'),
  job_id uuid not null references public.auftraege (id) on delete restrict,
  report_date date not null,
  status public.berichtsstatus not null default 'entwurf',
  internal_notes text,
  created_by uuid not null references public.benutzerprofile (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  submitted_by uuid references public.benutzerprofile (id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.benutzerprofile (id) on delete set null,
  review_comment text,
  -- Optimistische Sperre: jede Änderung erhöht die Version.
  version integer not null default 1 check (version > 0),
  -- Idempotenz: Wiederholte Speicher-Anfragen (z. B. nach Netzabbruch) werden erkannt.
  last_mutation_id uuid
);

alter sequence public.berichtsnummer_seq owned by public.arbeitsberichte.report_number;

create index arbeitsberichte_job_idx on public.arbeitsberichte (job_id);
create index arbeitsberichte_date_idx on public.arbeitsberichte (report_date);
create index arbeitsberichte_status_idx on public.arbeitsberichte (status, report_date);
create index arbeitsberichte_created_by_idx on public.arbeitsberichte (created_by);

create trigger arbeitsberichte_updated_at before update on public.arbeitsberichte
  for each row execute function public.aktualisiert_am_setzen();

create table public.arbeitsbericht_taetigkeiten (
  id uuid primary key default gen_random_uuid(),
  work_report_id uuid not null references public.arbeitsberichte (id) on delete cascade,
  position integer not null check (position >= 0),
  description text not null check (length(trim(description)) between 1 and 1000),
  unique (work_report_id, position) deferrable initially deferred
);

create table public.arbeitsbericht_material (
  id uuid primary key default gen_random_uuid(),
  work_report_id uuid not null references public.arbeitsberichte (id) on delete cascade,
  position integer not null check (position >= 0),
  catalog_article_id uuid references public.katalogartikel (id) on delete restrict,
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

create index arbeitsbericht_material_catalog_idx on public.arbeitsbericht_material (catalog_article_id)
  where catalog_article_id is not null;

-- ---------------------------------------------------------------------------
-- Zeiterfassung: EINZIGE Quelle für Arbeitszeiten
-- ---------------------------------------------------------------------------
create table public.zeiteintraege (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.mitarbeiter (id) on delete restrict,
  entry_date date not null,
  entry_type public.zeitart not null,
  job_id uuid references public.auftraege (id) on delete restrict,
  started_at timestamptz,
  ended_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  duration_minutes integer not null check (duration_minutes between 0 and 1440),
  billable boolean not null default false,
  note text,
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, employee_id),
  constraint zeiteintraege_start_end_pair check ((started_at is null) = (ended_at is null)),
  constraint zeiteintraege_end_after_start check (ended_at is null or ended_at > started_at),
  constraint zeiteintraege_max_span check (ended_at is null or ended_at - started_at <= interval '24 hours'),
  constraint zeiteintraege_start_on_entry_date check (
    started_at is null or (started_at at time zone 'Europe/Berlin')::date = entry_date
  ),
  -- Bei Von/Bis-Angabe muss die Dauer exakt (Ende − Beginn − Pause) entsprechen.
  constraint zeiteintraege_duration_matches check (
    started_at is null
    or duration_minutes = (extract(epoch from (ended_at - started_at))::integer / 60) - break_minutes
  ),
  constraint zeiteintraege_billable_requires_job check (not billable or job_id is not null),
  constraint zeiteintraege_billable_type check (not billable or entry_type in ('kundenarbeit', 'fahrzeit')),
  constraint zeiteintraege_break_no_job check (entry_type <> 'pause' or (job_id is null and not billable and break_minutes = 0)),
  constraint zeiteintraege_customer_work_job check (entry_type <> 'kundenarbeit' or job_id is not null)
);

create index zeiteintraege_employee_date_idx on public.zeiteintraege (employee_id, entry_date);
create index zeiteintraege_date_idx on public.zeiteintraege (entry_date);
create index zeiteintraege_job_idx on public.zeiteintraege (job_id) where job_id is not null;

create trigger zeiteintraege_updated_at before update on public.zeiteintraege
  for each row execute function public.aktualisiert_am_setzen();

-- Verknüpfung Bericht ↔ Zeiteintrag. Pro Bericht und Mitarbeiter genau EIN Eintrag,
-- jeder Zeiteintrag gehört höchstens zu EINEM Bericht → keine Duplikate möglich.
create table public.arbeitsbericht_zeiteintraege (
  work_report_id uuid not null references public.arbeitsberichte (id) on delete restrict,
  time_entry_id uuid not null unique,
  employee_id uuid not null,
  primary key (work_report_id, employee_id),
  foreign key (time_entry_id, employee_id) references public.zeiteintraege (id, employee_id)
);

create index arbeitsbericht_zeiteintraege_employee_idx on public.arbeitsbericht_zeiteintraege (employee_id);

-- ---------------------------------------------------------------------------
-- Abwesenheiten (tageweise; keine Verrechnungsregeln hinterlegt)
-- ---------------------------------------------------------------------------
create table public.fehlzeiten (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.mitarbeiter (id) on delete restrict,
  absence_type public.fehlzeitart not null,
  start_date date not null,
  end_date date not null,
  half_day boolean not null default false,
  note text,
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fehlzeiten_dates_valid check (end_date >= start_date),
  constraint fehlzeiten_half_day_single check (not half_day or start_date = end_date)
);

create index fehlzeiten_employee_idx on public.fehlzeiten (employee_id, start_date, end_date);

create trigger fehlzeiten_updated_at before update on public.fehlzeiten
  for each row execute function public.aktualisiert_am_setzen();

-- ---------------------------------------------------------------------------
-- Audit-Log
-- ---------------------------------------------------------------------------
create table public.aenderungsprotokoll (
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

create index aenderungsprotokoll_record_idx on public.aenderungsprotokoll (table_name, record_id, changed_at desc);
create index aenderungsprotokoll_changed_at_idx on public.aenderungsprotokoll (changed_at desc);

create or replace function public.aenderung_protokollieren()
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

  insert into public.aenderungsprotokoll (table_name, record_id, action, actor_id, reason, old_data, new_data)
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
    'benutzerprofile', 'mitarbeiter', 'kunden', 'einsatzorte', 'auftraege', 'auftragszuweisungen',
    'arbeitsberichte', 'arbeitsbericht_taetigkeiten', 'arbeitsbericht_material', 'zeiteintraege',
    'arbeitsbericht_zeiteintraege', 'fehlzeiten'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.aenderung_protokollieren()',
      t || '_audit', t);
  end loop;
end;
$$;
