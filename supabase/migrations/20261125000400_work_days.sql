-- Arbeitstag (Anwesenheit): Beginn, Ende und Pause je Mitarbeiter und Tag.
-- Grundlage für den Stundenzettel / die Lohnabrechnung. Die Zeiteinträge der
-- Arbeitsberichte bleiben die Zuordnung der Stunden zu Aufträgen (Abrechnung).
-- Nicht zugeordnete Zeit eines Arbeitstags gilt als Fahrt/Sonstiges.

create table public.arbeitstage (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.mitarbeiter (id) on delete restrict,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes between 0 and 600),
  duration_minutes integer generated always as (
    (extract(epoch from (end_time - start_time))::integer / 60) - break_minutes
  ) stored,
  note text check (note is null or length(note) <= 500),
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  constraint arbeitstage_end_after_start check (end_time > start_time),
  constraint arbeitstage_break_fits check (
    (extract(epoch from (end_time - start_time))::integer / 60) > break_minutes
  )
);

create index arbeitstage_date_idx on public.arbeitstage (work_date);

create trigger arbeitstage_updated_at before update on public.arbeitstage
  for each row execute function public.aktualisiert_am_setzen();

create trigger arbeitstage_audit after insert or update or delete on public.arbeitstage
  for each row execute function public.aenderung_protokollieren();

alter table public.arbeitstage enable row level security;
revoke all on public.arbeitstage from anon;

create policy arbeitstage_select on public.arbeitstage for select to authenticated
  using (public.ist_buero() or (public.ist_mitglied() and employee_id = public.aktuelle_mitarbeiter_id()));
create policy arbeitstage_insert on public.arbeitstage for insert to authenticated
  with check (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id());
create policy arbeitstage_update on public.arbeitstage for update to authenticated
  using (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id())
  with check (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id());
create policy arbeitstage_delete on public.arbeitstage for delete to authenticated
  using (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id());

-- Ortskürzel für die Bemerkungsspalte des Stundenzettels (z. B. „Girbach UL“)
create table public.ortskuerzel (
  city text primary key check (length(trim(city)) > 0),
  abbreviation text not null check (length(trim(abbreviation)) between 1 and 20),
  updated_at timestamptz not null default now()
);

create trigger ortskuerzel_updated_at before update on public.ortskuerzel
  for each row execute function public.aktualisiert_am_setzen();

alter table public.ortskuerzel enable row level security;
revoke all on public.ortskuerzel from anon;

create policy ortskuerzel_select on public.ortskuerzel for select to authenticated
  using (public.ist_mitglied());
create policy ortskuerzel_write on public.ortskuerzel for all to authenticated
  using (public.ist_buero()) with check (public.ist_buero());

insert into public.ortskuerzel (city, abbreviation) values
  ('Ulm', 'UL'),
  ('Langenau', 'LA');
