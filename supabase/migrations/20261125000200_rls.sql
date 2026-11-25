-- Row Level Security: Berechtigungen werden in der Datenbank durchgesetzt.
-- Sichtbarkeits-Helfer sind SECURITY DEFINER, um Policy-Rekursion zu vermeiden.

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and cardinality(p.roles) > 0
  );
$$;

create or replace function public.can_view_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_office() or exists (
    select 1 from public.jobs j
    where j.id = p_job_id
      and public.is_member()
      and (
        j.created_by = auth.uid()
        or exists (
          select 1 from public.job_assignments a
          where a.job_id = j.id and a.employee_id = public.current_employee_id()
        )
      )
  );
$$;

create or replace function public.can_view_customer(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_office() or (
    public.is_member() and (
      exists (select 1 from public.customers c where c.id = p_customer_id and c.created_by = auth.uid())
      or exists (
        select 1 from public.jobs j
        where j.customer_id = p_customer_id
          and (
            j.created_by = auth.uid()
            or exists (
              select 1 from public.job_assignments a
              where a.job_id = j.id and a.employee_id = public.current_employee_id()
            )
          )
      )
    )
  );
$$;

create or replace function public.can_view_report(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_office() or exists (
    select 1 from public.work_reports r
    where r.id = p_report_id
      and public.is_member()
      and (
        r.created_by = auth.uid()
        or exists (
          select 1 from public.work_report_time_entries l
          where l.work_report_id = r.id and l.employee_id = public.current_employee_id()
        )
        or public.can_view_job(r.job_id)
      )
  );
$$;

-- Für Auftragsanlage zu einem per Dublettenprüfung gefundenen Bestandskunden.
create or replace function public.customer_is_active(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.customers c where c.id = p_customer_id and c.archived_at is null);
$$;

-- Namensverzeichnis für Mitarbeiter (ohne Vertragsdaten wie Sollstunden/Urlaub).
create or replace function public.employee_directory()
returns table (
  id uuid,
  profile_id uuid,
  first_name text,
  last_name text,
  employment_role public.employment_role,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.profile_id, e.first_name, e.last_name, e.employment_role, e.is_active
  from public.employees e
  where public.is_member()
  order by e.is_active desc, e.last_name, e.first_name;
$$;

-- ---------------------------------------------------------------------------
-- RLS aktivieren
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.service_locations enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.catalog_articles enable row level security;
alter table public.work_reports enable row level security;
alter table public.work_report_activities enable row level security;
alter table public.work_report_materials enable row level security;
alter table public.time_entries enable row level security;
alter table public.work_report_time_entries enable row level security;
alter table public.employee_absences enable row level security;
alter table public.audit_logs enable row level security;

-- Kein Zugriff für anonyme Anfragen – unabhängig von Policies.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon, public;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
-- Funktionen erhalten standardmäßig EXECUTE für PUBLIC; das lässt sich nur global entziehen.
alter default privileges revoke execute on functions from public;

grant usage on schema public to authenticated;
grant execute on function
  public.has_role(public.app_role), public.is_admin(), public.is_office(), public.is_member(),
  public.current_employee_id(), public.can_view_job(uuid), public.can_view_customer(uuid),
  public.can_view_report(uuid), public.customer_is_active(uuid), public.employee_directory()
  to authenticated;

-- Profile: Schreibzugriff nur über admin_set_user_access().
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_office());

-- Mitarbeiter
create policy employees_select on public.employees for select to authenticated
  using (public.is_office() or (profile_id = auth.uid() and public.is_member()));
create policy employees_insert on public.employees for insert to authenticated
  with check (public.is_office());
create policy employees_update on public.employees for update to authenticated
  using (public.is_office()) with check (public.is_office());

-- Kunden
-- created_by direkt prüfen: STABLE-Helfer sehen in INSERT … RETURNING die neue Zeile noch nicht.
create policy customers_select on public.customers for select to authenticated
  using (public.can_view_customer(id) or (created_by = auth.uid() and public.is_member()));
create policy customers_insert on public.customers for insert to authenticated
  with check (public.is_office() or (public.current_employee_id() is not null and created_by = auth.uid()));
create policy customers_update on public.customers for update to authenticated
  using (public.is_office()) with check (public.is_office());

-- Einsatzorte
create policy service_locations_select on public.service_locations for select to authenticated
  using (public.can_view_customer(customer_id));
create policy service_locations_insert on public.service_locations for insert to authenticated
  with check (
    public.is_office()
    or (public.current_employee_id() is not null and public.can_view_customer(customer_id))
  );
create policy service_locations_update on public.service_locations for update to authenticated
  using (public.is_office()) with check (public.is_office());

-- Aufträge. Mitarbeiter dürfen Aufträge anlegen (auch für per Dublettenprüfung
-- gefundene Bestandskunden) und werden dabei automatisch zugewiesen.
create policy jobs_select on public.jobs for select to authenticated
  using (public.can_view_job(id) or (created_by = auth.uid() and public.is_member()));
create policy jobs_insert on public.jobs for insert to authenticated
  with check (
    public.is_office()
    or (
      public.current_employee_id() is not null
      and created_by = auth.uid()
      and status in ('geplant', 'in_bearbeitung')
      and public.customer_is_active(customer_id)
    )
  );
create policy jobs_update on public.jobs for update to authenticated
  using (public.is_office()) with check (public.is_office());

create policy job_assignments_select on public.job_assignments for select to authenticated
  using (public.can_view_job(job_id));
create policy job_assignments_insert on public.job_assignments for insert to authenticated
  with check (public.is_office());
create policy job_assignments_delete on public.job_assignments for delete to authenticated
  using (public.is_office());

-- Katalog: nur lesend (Import später serverseitig).
create policy catalog_articles_select on public.catalog_articles for select to authenticated
  using (public.is_member());

-- Arbeitsberichte: Schreibzugriff ausschließlich über save_work_report() & Co.
create policy work_reports_select on public.work_reports for select to authenticated
  using (public.can_view_report(id));
create policy work_report_activities_select on public.work_report_activities for select to authenticated
  using (public.can_view_report(work_report_id));
create policy work_report_materials_select on public.work_report_materials for select to authenticated
  using (public.can_view_report(work_report_id));
create policy work_report_time_entries_select on public.work_report_time_entries for select to authenticated
  using (public.can_view_report(work_report_id));

-- Zeiteinträge. Kundenarbeit entsteht nur über Arbeitsberichte; berichtsgebundene
-- Einträge sind direkt nicht änderbar (nur über den Bericht → nachvollziehbar).
create policy time_entries_select on public.time_entries for select to authenticated
  using (
    public.is_office()
    or (public.is_member() and employee_id = public.current_employee_id())
    or exists (select 1 from public.work_report_time_entries l where l.time_entry_id = time_entries.id)
  );
create policy time_entries_insert on public.time_entries for insert to authenticated
  with check (
    entry_type <> 'kundenarbeit'
    and (public.is_office() or employee_id = public.current_employee_id())
    and (job_id is null or public.can_view_job(job_id))
  );
create policy time_entries_update on public.time_entries for update to authenticated
  using (
    (public.is_office() or employee_id = public.current_employee_id())
    and not exists (select 1 from public.work_report_time_entries l where l.time_entry_id = time_entries.id)
  )
  with check (
    entry_type <> 'kundenarbeit'
    and (public.is_office() or employee_id = public.current_employee_id())
    and (job_id is null or public.can_view_job(job_id))
  );
create policy time_entries_delete on public.time_entries for delete to authenticated
  using (
    (public.is_office() or employee_id = public.current_employee_id())
    and not exists (select 1 from public.work_report_time_entries l where l.time_entry_id = time_entries.id)
  );

-- Abwesenheiten: Pflege durch das Büro, Mitarbeiter sehen eigene.
create policy employee_absences_select on public.employee_absences for select to authenticated
  using (public.is_office() or (public.is_member() and employee_id = public.current_employee_id()));
create policy employee_absences_insert on public.employee_absences for insert to authenticated
  with check (public.is_office());
create policy employee_absences_update on public.employee_absences for update to authenticated
  using (public.is_office()) with check (public.is_office());
create policy employee_absences_delete on public.employee_absences for delete to authenticated
  using (public.is_office());

-- Audit-Log: nur lesbar (Büro/Admin), Schreiben ausschließlich per Trigger.
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.is_office());
revoke insert, update, delete on public.audit_logs from authenticated;

-- Tabellen ohne Lösch-Policy können nicht gelöscht werden (Archivierung statt Löschen).

-- ---------------------------------------------------------------------------
-- Auswertungs-View (RLS des Aufrufers gilt: security_invoker)
-- ---------------------------------------------------------------------------
create view public.employee_daily_minutes
with (security_invoker = true)
as
select
  t.employee_id,
  t.entry_date,
  sum(t.duration_minutes) filter (where t.entry_type <> 'pause')::integer as work_minutes,
  sum(t.duration_minutes) filter (where t.billable)::integer as billable_minutes,
  sum(t.duration_minutes) filter (where t.entry_type <> 'pause' and not t.billable)::integer as non_billable_minutes,
  (sum(t.break_minutes) + coalesce(sum(t.duration_minutes) filter (where t.entry_type = 'pause'), 0))::integer as break_minutes,
  count(*)::integer as entry_count
from public.time_entries t
group by t.employee_id, t.entry_date;

grant select on public.employee_daily_minutes to authenticated;
revoke all on public.employee_daily_minutes from anon;
