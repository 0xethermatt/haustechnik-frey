-- Mitarbeiter, die ihre Zeiten nicht selbst erfassen (z. B. der Inhaber, der auf Papier schreibt):
-- Sie erscheinen nicht unter „Fehlende Zeiten“ und im Abgabe-Check und bekommen keinen automatischen
-- Arbeitstag aus Berichtsstunden. In Berichten mit Stunden lassen sie sich weiterhin eintragen.

alter table public.mitarbeiter add column if not exists requires_time_tracking boolean not null default true;

-- Kein automatischer Arbeitstag für Mitarbeiter ohne Erfassungspflicht.
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
  if exists (select 1 from public.mitarbeiter where id = p_employee and not requires_time_tracking) then
    return;
  end if;

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

-- Beim Umschalten: ohne Pflicht werden automatische Arbeitstage entfernt, mit Pflicht werden sie nachgezogen.
create or replace function public.mitarbeiter_erfassung_umschalten()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date;
begin
  if new.requires_time_tracking is not distinct from old.requires_time_tracking then
    return new;
  end if;
  if not new.requires_time_tracking then
    delete from public.arbeitstage where employee_id = new.id and automatisch;
  else
    for d in select distinct entry_date from public.zeiteintraege where employee_id = new.id and entry_type <> 'pause' loop
      perform public.arbeitstag_nachziehen(new.id, d);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists mitarbeiter_erfassung on public.mitarbeiter;
create trigger mitarbeiter_erfassung after update of requires_time_tracking on public.mitarbeiter
  for each row execute function public.mitarbeiter_erfassung_umschalten();
