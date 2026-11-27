-- Update 26.11.2026 (2): Arbeitstag automatisch aus Berichtsstunden.
-- Beliebig oft ausführbar. Im Supabase SQL Editor komplett einfügen und „Run“ klicken.
-- Erwartet: „Success. No rows returned“.
-- Voraussetzung: das erste Update (Berufsschule + Fotos) ist eingespielt.

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
