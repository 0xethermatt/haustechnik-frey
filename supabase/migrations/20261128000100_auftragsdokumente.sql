-- Dokumente zu Aufträgen (PDF, Word, Excel, Pläne, Lieferscheine … beliebige Dateien).
-- Sichtbar für alle, die den Auftrag sehen dürfen. Dateien liegen im privaten Storage-Bucket
-- „auftragsdokumente“ (Pfad: <auftrags-id>/<dokument-id>.<endung>), hier stehen nur die Angaben.

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
