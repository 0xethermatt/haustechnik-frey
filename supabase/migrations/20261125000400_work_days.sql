-- Arbeitstag (Anwesenheit): Beginn, Ende und Pause je Mitarbeiter und Tag.
-- Grundlage für den Stundenzettel / die Lohnabrechnung. Die Zeiteinträge der
-- Arbeitsberichte bleiben die Zuordnung der Stunden zu Aufträgen (Abrechnung).
-- Nicht zugeordnete Zeit eines Arbeitstags gilt als Fahrt/Sonstiges.

create table public.work_days (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 0 check (break_minutes between 0 and 600),
  duration_minutes integer generated always as (
    (extract(epoch from (end_time - start_time))::integer / 60) - break_minutes
  ) stored,
  note text check (note is null or length(note) <= 500),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  constraint work_days_end_after_start check (end_time > start_time),
  constraint work_days_break_fits check (
    (extract(epoch from (end_time - start_time))::integer / 60) > break_minutes
  )
);

create index work_days_date_idx on public.work_days (work_date);

create trigger work_days_updated_at before update on public.work_days
  for each row execute function public.set_updated_at();

create trigger work_days_audit after insert or update or delete on public.work_days
  for each row execute function public.write_audit_log();

alter table public.work_days enable row level security;
revoke all on public.work_days from anon;

create policy work_days_select on public.work_days for select to authenticated
  using (public.is_office() or (public.is_member() and employee_id = public.current_employee_id()));
create policy work_days_insert on public.work_days for insert to authenticated
  with check (public.is_office() or employee_id = public.current_employee_id());
create policy work_days_update on public.work_days for update to authenticated
  using (public.is_office() or employee_id = public.current_employee_id())
  with check (public.is_office() or employee_id = public.current_employee_id());
create policy work_days_delete on public.work_days for delete to authenticated
  using (public.is_office() or employee_id = public.current_employee_id());

-- Ortskürzel für die Bemerkungsspalte des Stundenzettels (z. B. „Girbach UL“)
create table public.place_abbreviations (
  city text primary key check (length(trim(city)) > 0),
  abbreviation text not null check (length(trim(abbreviation)) between 1 and 20),
  updated_at timestamptz not null default now()
);

create trigger place_abbreviations_updated_at before update on public.place_abbreviations
  for each row execute function public.set_updated_at();

alter table public.place_abbreviations enable row level security;
revoke all on public.place_abbreviations from anon;

create policy place_abbreviations_select on public.place_abbreviations for select to authenticated
  using (public.is_member());
create policy place_abbreviations_write on public.place_abbreviations for all to authenticated
  using (public.is_office()) with check (public.is_office());

insert into public.place_abbreviations (city, abbreviation) values
  ('Ulm', 'UL'),
  ('Langenau', 'LA');
