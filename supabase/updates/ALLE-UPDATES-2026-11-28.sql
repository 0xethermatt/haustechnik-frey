-- Alle SQL-Updates vom 26. bis 28.11.2026 in einer Datei, in der richtigen Reihenfolge.
-- Beliebig oft ausführbar: Was schon eingespielt ist, wird übersprungen. Komplett in den Supabase SQL Editor einfügen und „Run“ klicken.
-- Enthalten: 1) Berufsschule + Fotos, 2) Arbeitstag automatisch, 3) Aufträge löschen, 4) Berichte löschen, 5) Dokumente zu Aufträgen.

-- ================================================================
-- 2026-11-26-berufsschule-und-fotos
-- ================================================================

-- 1) Berufsschultag: Azubis tragen die Schule pauschal als Arbeitstag ein (zählt als Arbeitszeit).
alter table public.arbeitstage add column if not exists berufsschule boolean not null default false;

-- 2) Fotos zu Aufträgen: Metadaten in der Tabelle, Bilddateien im privaten Storage-Bucket „auftragsfotos“.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fotophase' and typnamespace = 'public'::regnamespace) then
    create type public.fotophase as enum (
      'bestand', 'rohinstallation', 'heizungsanlage', 'fertigmontage', 'inbetriebnahme', 'sonstiges'
    );
  end if;
end;
$$;

create table if not exists public.auftragsfotos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.auftraege (id) on delete restrict,
  storage_path text not null unique,
  thumb_path text not null unique,
  phase public.fotophase not null default 'sonstiges',
  caption text check (caption is null or length(caption) <= 300),
  taken_on date not null default (now() at time zone 'Europe/Berlin')::date,
  size_bytes integer check (size_bytes is null or size_bytes > 0),
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists auftragsfotos_job_idx on public.auftragsfotos (job_id, created_at desc);

drop trigger if exists auftragsfotos_audit on public.auftragsfotos;
create trigger auftragsfotos_audit after insert or update or delete on public.auftragsfotos
  for each row execute function public.aenderung_protokollieren();

alter table public.auftragsfotos enable row level security;
revoke all on public.auftragsfotos from anon;

drop policy if exists auftragsfotos_select on public.auftragsfotos;
drop policy if exists auftragsfotos_insert on public.auftragsfotos;
drop policy if exists auftragsfotos_update on public.auftragsfotos;
drop policy if exists auftragsfotos_delete on public.auftragsfotos;

create policy auftragsfotos_select on public.auftragsfotos for select to authenticated
  using (public.darf_auftrag_sehen(job_id));
create policy auftragsfotos_insert on public.auftragsfotos for insert to authenticated
  with check (public.darf_auftrag_sehen(job_id) and created_by = auth.uid());
create policy auftragsfotos_update on public.auftragsfotos for update to authenticated
  using (public.ist_buero() or created_by = auth.uid())
  with check (public.ist_buero() or created_by = auth.uid());
create policy auftragsfotos_delete on public.auftragsfotos for delete to authenticated
  using (public.ist_buero() or created_by = auth.uid());

-- Auftrags-ID aus dem Dateipfad („<uuid>/…“); null bei fremden Pfaden.
create or replace function public.foto_auftrag_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then split_part(p_name, '/', 1)::uuid
  end
$$;

grant execute on function public.foto_auftrag_id(text) to authenticated;

-- 3) Storage-Bucket und Zugriffsregeln (nur wo das Storage-Schema existiert)
do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('auftragsfotos', 'auftragsfotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;

  drop policy if exists auftragsfotos_objekte_lesen on storage.objects;
  drop policy if exists auftragsfotos_objekte_anlegen on storage.objects;
  drop policy if exists auftragsfotos_objekte_loeschen on storage.objects;

  create policy auftragsfotos_objekte_lesen on storage.objects for select to authenticated
    using (bucket_id = 'auftragsfotos' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsfotos_objekte_anlegen on storage.objects for insert to authenticated
    with check (bucket_id = 'auftragsfotos' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsfotos_objekte_loeschen on storage.objects for delete to authenticated
    using (bucket_id = 'auftragsfotos' and (public.ist_buero() or owner_id = auth.uid()::text));
end;
$$;

-- ================================================================
-- 2026-11-26-arbeitstag-automatisch
-- ================================================================

alter table public.arbeitstage add column if not exists automatisch boolean not null default false;

-- Jede Änderung außerhalb der Automatik gilt als manuell.
create or replace function public.arbeitstag_automatisch_markieren()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.automatisch := coalesce(current_setting('app.arbeitstag_auto', true), '') = 'on';
  return new;
end;
$$;

drop trigger if exists arbeitstage_automatisch on public.arbeitstage;
create trigger arbeitstage_automatisch before insert or update on public.arbeitstage
  for each row execute function public.arbeitstag_automatisch_markieren();

create or replace function public.arbeitstag_nachziehen(p_employee uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alloc integer;
  v_end time;
  v_row public.arbeitstage%rowtype;
  v_found boolean;
begin
  select coalesce(sum(duration_minutes), 0)::integer into v_alloc
  from public.zeiteintraege
  where employee_id = p_employee and entry_date = p_date and entry_type <> 'pause';

  select * into v_row from public.arbeitstage where employee_id = p_employee and work_date = p_date;
  v_found := found;
  if v_found and not v_row.automatisch then
    return;
  end if;

  perform set_config('app.arbeitstag_auto', 'on', true);
  if v_alloc = 0 then
    if v_found then
      delete from public.arbeitstage where id = v_row.id;
    end if;
  else
    v_end := time '07:30' + make_interval(mins => least(v_alloc, 960));
    if v_found then
      update public.arbeitstage set end_time = v_end, break_minutes = 0
      where id = v_row.id and (end_time <> v_end or break_minutes <> 0);
    else
      insert into public.arbeitstage (employee_id, work_date, start_time, end_time, break_minutes)
      values (p_employee, p_date, time '07:30', v_end, 0);
    end if;
  end if;
  perform set_config('app.arbeitstag_auto', '', true);
end;
$$;

create or replace function public.arbeitstag_nachziehen_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.arbeitstag_nachziehen(old.employee_id, old.entry_date);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    if tg_op = 'INSERT' or new.employee_id is distinct from old.employee_id or new.entry_date is distinct from old.entry_date then
      perform public.arbeitstag_nachziehen(new.employee_id, new.entry_date);
    elsif new.duration_minutes is distinct from old.duration_minutes or new.entry_type is distinct from old.entry_type then
      perform public.arbeitstag_nachziehen(new.employee_id, new.entry_date);
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists zeiteintraege_arbeitstag on public.zeiteintraege;
create trigger zeiteintraege_arbeitstag after insert or update or delete on public.zeiteintraege
  for each row execute function public.arbeitstag_nachziehen_trigger();

-- Bestehende Tage mit Stunden, aber ohne Arbeitstag, nachtragen (vorhandene Arbeitstage bleiben unberührt).
do $$
begin
  perform set_config('app.arbeitstag_auto', 'on', true);
  insert into public.arbeitstage (employee_id, work_date, start_time, end_time, break_minutes, created_at)
  select z.employee_id, z.entry_date, time '07:30',
         time '07:30' + make_interval(mins => least(sum(z.duration_minutes)::integer, 960)), 0, min(z.created_at)
  from public.zeiteintraege z
  where z.entry_type <> 'pause'
  group by z.employee_id, z.entry_date
  having sum(z.duration_minutes) > 0
  on conflict (employee_id, work_date) do nothing;
  perform set_config('app.arbeitstag_auto', '', true);
end;
$$;

-- ================================================================
-- 2026-11-27-auftrag-loeschen
-- ================================================================

create or replace function public.auftrag_loeschvorschau(p_job_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_job public.auftraege%rowtype;
  v_reports integer;
  v_entries integer;
  v_photos integer;
  v_people integer;
  v_allowed boolean := false;
  v_reason text := null;
begin
  select * into v_job from public.auftraege where id = p_job_id;
  if not found or not public.darf_auftrag_sehen(p_job_id) then
    return jsonb_build_object('allowed', false, 'reason', 'NOT_FOUND');
  end if;

  select count(*) into v_reports from public.arbeitsberichte where job_id = p_job_id;
  select count(*), count(distinct employee_id) into v_entries, v_people from public.zeiteintraege where job_id = p_job_id;
  select count(*) into v_photos from public.auftragsfotos where job_id = p_job_id;

  if v_job.status = 'abgerechnet' then
    v_reason := 'BILLED';
  elsif public.ist_buero() then
    v_allowed := true;
  elsif v_job.created_by = auth.uid() and public.ist_mitglied() then
    if v_reports = 0 and v_entries = 0 and v_photos = 0 then
      v_allowed := true;
    else
      v_reason := 'HAS_CONTENT';
    end if;
  else
    v_reason := 'FORBIDDEN';
  end if;

  return jsonb_build_object('allowed', v_allowed, 'reason', v_reason, 'reports', v_reports,
    'time_entries', v_entries, 'people', v_people, 'photos', v_photos);
end;
$$;

create or replace function public.auftrag_loeschen(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preview jsonb := public.auftrag_loeschvorschau(p_job_id);
  v_paths text[];
begin
  if not (v_preview ->> 'allowed')::boolean then
    perform public.app_fehler(
      case coalesce(v_preview ->> 'reason', 'FORBIDDEN')
        when 'BILLED' then 'LOCKED'
        when 'NOT_FOUND' then 'NOT_FOUND'
        else 'FORBIDDEN'
      end,
      case coalesce(v_preview ->> 'reason', 'FORBIDDEN')
        when 'BILLED' then 'Abgerechnete Aufträge können nicht gelöscht werden.'
        when 'NOT_FOUND' then 'Auftrag nicht gefunden.'
        when 'HAS_CONTENT' then 'Zu diesem Auftrag gibt es bereits Berichte, Zeiten oder Fotos. Bitte das Büro fragen.'
        else 'Keine Berechtigung zum Löschen.'
      end);
  end if;

  perform set_config('app.change_reason', 'Auftrag gelöscht', true);

  delete from public.arbeitsbericht_zeiteintraege
  where work_report_id in (select id from public.arbeitsberichte where job_id = p_job_id);
  delete from public.zeiteintraege where job_id = p_job_id;
  delete from public.arbeitsberichte where job_id = p_job_id;

  with gone as (
    delete from public.auftragsfotos where job_id = p_job_id returning storage_path, thumb_path
  )
  select coalesce(array_agg(p), '{}') into v_paths
  from gone, lateral unnest(array[gone.storage_path, gone.thumb_path]) as p;

  delete from public.auftraege where id = p_job_id;

  return v_preview || jsonb_build_object('photo_paths', to_jsonb(v_paths));
end;
$$;

grant execute on function public.auftrag_loeschvorschau(uuid), public.auftrag_loeschen(uuid) to authenticated;

-- ================================================================
-- 2026-11-27-bericht-loeschen
-- ================================================================

create or replace function public.arbeitsbericht_loeschen(p_report_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.arbeitsberichte%rowtype;
  v_job_status public.auftragsstatus;
  v_entries integer;
  v_people integer;
  v_minutes integer;
begin
  if not public.ist_buero() then
    perform public.app_fehler('FORBIDDEN', 'Nur Büro oder Admin dürfen Berichte löschen.');
  end if;

  select * into v_report from public.arbeitsberichte where id = p_report_id for update;
  if not found then
    perform public.app_fehler('NOT_FOUND', 'Bericht nicht gefunden.');
  end if;

  select status into v_job_status from public.auftraege where id = v_report.job_id;
  if v_job_status = 'abgerechnet' then
    perform public.app_fehler('LOCKED', 'Berichte abgerechneter Aufträge können nicht gelöscht werden.');
  end if;

  select count(*), count(distinct t.employee_id), coalesce(sum(t.duration_minutes), 0)
    into v_entries, v_people, v_minutes
  from public.arbeitsbericht_zeiteintraege l
  join public.zeiteintraege t on t.id = l.time_entry_id
  where l.work_report_id = p_report_id;

  perform set_config('app.change_reason', 'Bericht gelöscht', true);

  with removed as (
    delete from public.arbeitsbericht_zeiteintraege l where l.work_report_id = p_report_id
    returning l.time_entry_id
  )
  delete from public.zeiteintraege t using removed r where t.id = r.time_entry_id;
  delete from public.arbeitsberichte where id = p_report_id;

  return jsonb_build_object('status', v_report.status, 'time_entries', v_entries, 'people', v_people, 'minutes', v_minutes);
end;
$$;

grant execute on function public.arbeitsbericht_loeschen(uuid) to authenticated;

-- ================================================================
-- 2026-11-28-dokumente
-- ================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'dokumentart' and typnamespace = 'public'::regnamespace) then
    create type public.dokumentart as enum ('angebot', 'aufmass', 'plan', 'lieferschein', 'datenblatt', 'protokoll', 'sonstiges');
  end if;
end;
$$;

create table if not exists public.auftragsdokumente (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.auftraege (id) on delete restrict,
  storage_path text not null unique,
  filename text not null check (length(trim(filename)) between 1 and 255),
  mime_type text,
  art public.dokumentart not null default 'sonstiges',
  note text check (note is null or length(note) <= 300),
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists auftragsdokumente_job_idx on public.auftragsdokumente (job_id, created_at desc);

drop trigger if exists auftragsdokumente_audit on public.auftragsdokumente;
create trigger auftragsdokumente_audit after insert or update or delete on public.auftragsdokumente
  for each row execute function public.aenderung_protokollieren();

alter table public.auftragsdokumente enable row level security;
revoke all on public.auftragsdokumente from anon;

drop policy if exists auftragsdokumente_select on public.auftragsdokumente;
drop policy if exists auftragsdokumente_insert on public.auftragsdokumente;
drop policy if exists auftragsdokumente_update on public.auftragsdokumente;
drop policy if exists auftragsdokumente_delete on public.auftragsdokumente;

create policy auftragsdokumente_select on public.auftragsdokumente for select to authenticated
  using (public.darf_auftrag_sehen(job_id));
create policy auftragsdokumente_insert on public.auftragsdokumente for insert to authenticated
  with check (public.darf_auftrag_sehen(job_id) and created_by = auth.uid());
create policy auftragsdokumente_update on public.auftragsdokumente for update to authenticated
  using (public.ist_buero() or created_by = auth.uid())
  with check (public.ist_buero() or created_by = auth.uid());
create policy auftragsdokumente_delete on public.auftragsdokumente for delete to authenticated
  using (public.ist_buero() or created_by = auth.uid());

-- Storage-Bucket und Zugriffsregeln (nur wo das Storage-Schema existiert)
do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit)
  values ('auftragsdokumente', 'auftragsdokumente', false, 26214400)
  on conflict (id) do nothing;

  drop policy if exists auftragsdokumente_objekte_lesen on storage.objects;
  drop policy if exists auftragsdokumente_objekte_anlegen on storage.objects;
  drop policy if exists auftragsdokumente_objekte_loeschen on storage.objects;

  create policy auftragsdokumente_objekte_lesen on storage.objects for select to authenticated
    using (bucket_id = 'auftragsdokumente' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsdokumente_objekte_anlegen on storage.objects for insert to authenticated
    with check (bucket_id = 'auftragsdokumente' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsdokumente_objekte_loeschen on storage.objects for delete to authenticated
    using (bucket_id = 'auftragsdokumente' and (public.ist_buero() or owner_id = auth.uid()::text));
end;
$$;

-- Auftrag löschen berücksichtigt jetzt auch Dokumente (Vorschau zählt sie, Löschen entfernt sie und liefert die Dateipfade).
create or replace function public.auftrag_loeschvorschau(p_job_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_job public.auftraege%rowtype;
  v_reports integer;
  v_entries integer;
  v_photos integer;
  v_docs integer;
  v_people integer;
  v_allowed boolean := false;
  v_reason text := null;
begin
  select * into v_job from public.auftraege where id = p_job_id;
  if not found or not public.darf_auftrag_sehen(p_job_id) then
    return jsonb_build_object('allowed', false, 'reason', 'NOT_FOUND');
  end if;

  select count(*) into v_reports from public.arbeitsberichte where job_id = p_job_id;
  select count(*), count(distinct employee_id) into v_entries, v_people from public.zeiteintraege where job_id = p_job_id;
  select count(*) into v_photos from public.auftragsfotos where job_id = p_job_id;
  select count(*) into v_docs from public.auftragsdokumente where job_id = p_job_id;

  if v_job.status = 'abgerechnet' then
    v_reason := 'BILLED';
  elsif public.ist_buero() then
    v_allowed := true;
  elsif v_job.created_by = auth.uid() and public.ist_mitglied() then
    if v_reports = 0 and v_entries = 0 and v_photos = 0 and v_docs = 0 then
      v_allowed := true;
    else
      v_reason := 'HAS_CONTENT';
    end if;
  else
    v_reason := 'FORBIDDEN';
  end if;

  return jsonb_build_object('allowed', v_allowed, 'reason', v_reason, 'reports', v_reports,
    'time_entries', v_entries, 'people', v_people, 'photos', v_photos, 'documents', v_docs);
end;
$$;

create or replace function public.auftrag_loeschen(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preview jsonb := public.auftrag_loeschvorschau(p_job_id);
  v_paths text[];
  v_doc_paths text[];
begin
  if not (v_preview ->> 'allowed')::boolean then
    perform public.app_fehler(
      case coalesce(v_preview ->> 'reason', 'FORBIDDEN')
        when 'BILLED' then 'LOCKED'
        when 'NOT_FOUND' then 'NOT_FOUND'
        else 'FORBIDDEN'
      end,
      case coalesce(v_preview ->> 'reason', 'FORBIDDEN')
        when 'BILLED' then 'Abgerechnete Aufträge können nicht gelöscht werden.'
        when 'NOT_FOUND' then 'Auftrag nicht gefunden.'
        when 'HAS_CONTENT' then 'Zu diesem Auftrag gibt es bereits Berichte, Zeiten, Fotos oder Dokumente. Bitte das Büro fragen.'
        else 'Keine Berechtigung zum Löschen.'
      end);
  end if;

  perform set_config('app.change_reason', 'Auftrag gelöscht', true);

  delete from public.arbeitsbericht_zeiteintraege
  where work_report_id in (select id from public.arbeitsberichte where job_id = p_job_id);
  delete from public.zeiteintraege where job_id = p_job_id;
  delete from public.arbeitsberichte where job_id = p_job_id;

  with gone as (
    delete from public.auftragsfotos where job_id = p_job_id returning storage_path, thumb_path
  )
  select coalesce(array_agg(p), '{}') into v_paths
  from gone, lateral unnest(array[gone.storage_path, gone.thumb_path]) as p;

  with gone as (
    delete from public.auftragsdokumente where job_id = p_job_id returning storage_path
  )
  select coalesce(array_agg(storage_path), '{}') into v_doc_paths from gone;

  delete from public.auftraege where id = p_job_id;

  return v_preview || jsonb_build_object('photo_paths', to_jsonb(v_paths), 'document_paths', to_jsonb(v_doc_paths));
end;
$$;

grant execute on function public.auftrag_loeschvorschau(uuid), public.auftrag_loeschen(uuid) to authenticated;
