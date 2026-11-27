-- Büro/Admin können einen Arbeitsbericht in jedem Status komplett löschen (inkl. Zeiteinträgen der Beteiligten).
-- Gesperrt, wenn der Auftrag bereits abgerechnet ist. Die Löschung steht im Änderungsprotokoll.
-- Mitarbeiter können weiterhin nur ihre eigenen Entwürfe verwerfen (arbeitsbericht_entwurf_loeschen).

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
