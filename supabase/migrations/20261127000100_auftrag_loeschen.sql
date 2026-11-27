-- Fälschlich angelegte Aufträge komplett löschen (inkl. Berichte, Zeiteinträge und Fotodaten).
-- Wer darf: Büro/Admin jeden Auftrag (außer „abgerechnet“); ein Mitarbeiter nur einen selbst angelegten Auftrag,
-- zu dem noch nichts erfasst wurde. Die Löschung wird im Änderungsprotokoll festgehalten.
-- Automatisch aus Berichtsstunden entstandene Arbeitstage passen sich über die Automatik an;
-- von Hand erfasste Arbeitstage bleiben unberührt. Fotodateien entfernt die App danach im Storage.

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
