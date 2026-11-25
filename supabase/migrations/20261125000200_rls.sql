-- Row Level Security: Berechtigungen werden in der Datenbank durchgesetzt.
-- Sichtbarkeits-Helfer sind SECURITY DEFINER, um Policy-Rekursion zu vermeiden.

create or replace function public.ist_mitglied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.benutzerprofile p
    where p.id = auth.uid() and p.is_active and cardinality(p.roles) > 0
  );
$$;

create or replace function public.darf_auftrag_sehen(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.ist_buero() or exists (
    select 1 from public.auftraege j
    where j.id = p_job_id
      and public.ist_mitglied()
      and (
        j.created_by = auth.uid()
        or exists (
          select 1 from public.auftragszuweisungen a
          where a.job_id = j.id and a.employee_id = public.aktuelle_mitarbeiter_id()
        )
      )
  );
$$;

create or replace function public.darf_kunde_sehen(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.ist_buero() or (
    public.ist_mitglied() and (
      exists (select 1 from public.kunden c where c.id = p_customer_id and c.created_by = auth.uid())
      or exists (
        select 1 from public.auftraege j
        where j.customer_id = p_customer_id
          and (
            j.created_by = auth.uid()
            or exists (
              select 1 from public.auftragszuweisungen a
              where a.job_id = j.id and a.employee_id = public.aktuelle_mitarbeiter_id()
            )
          )
      )
    )
  );
$$;

create or replace function public.darf_bericht_sehen(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.ist_buero() or exists (
    select 1 from public.arbeitsberichte r
    where r.id = p_report_id
      and public.ist_mitglied()
      and (
        r.created_by = auth.uid()
        or exists (
          select 1 from public.arbeitsbericht_zeiteintraege l
          where l.work_report_id = r.id and l.employee_id = public.aktuelle_mitarbeiter_id()
        )
        or public.darf_auftrag_sehen(r.job_id)
      )
  );
$$;

-- Für Auftragsanlage zu einem per Dublettenprüfung gefundenen Bestandskunden.
create or replace function public.kunde_ist_aktiv(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.kunden c where c.id = p_customer_id and c.archived_at is null);
$$;

-- Namensverzeichnis für Mitarbeiter (ohne Vertragsdaten wie Sollstunden/Urlaub).
create or replace function public.mitarbeiter_verzeichnis()
returns table (
  id uuid,
  profile_id uuid,
  first_name text,
  last_name text,
  employment_role public.beschaeftigungsart,
  is_active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.profile_id, e.first_name, e.last_name, e.employment_role, e.is_active
  from public.mitarbeiter e
  where public.ist_mitglied()
  order by e.is_active desc, e.last_name, e.first_name;
$$;

-- ---------------------------------------------------------------------------
-- RLS aktivieren
-- ---------------------------------------------------------------------------
alter table public.benutzerprofile enable row level security;
alter table public.mitarbeiter enable row level security;
alter table public.kunden enable row level security;
alter table public.einsatzorte enable row level security;
alter table public.auftraege enable row level security;
alter table public.auftragszuweisungen enable row level security;
alter table public.katalogartikel enable row level security;
alter table public.arbeitsberichte enable row level security;
alter table public.arbeitsbericht_taetigkeiten enable row level security;
alter table public.arbeitsbericht_material enable row level security;
alter table public.zeiteintraege enable row level security;
alter table public.arbeitsbericht_zeiteintraege enable row level security;
alter table public.fehlzeiten enable row level security;
alter table public.aenderungsprotokoll enable row level security;

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
  public.hat_rolle(public.app_rolle), public.ist_admin(), public.ist_buero(), public.ist_mitglied(),
  public.aktuelle_mitarbeiter_id(), public.darf_auftrag_sehen(uuid), public.darf_kunde_sehen(uuid),
  public.darf_bericht_sehen(uuid), public.kunde_ist_aktiv(uuid), public.mitarbeiter_verzeichnis()
  to authenticated;

-- Profile: Schreibzugriff nur über zugang_setzen().
create policy benutzerprofile_select on public.benutzerprofile for select to authenticated
  using (id = auth.uid() or public.ist_buero());

-- Mitarbeiter
create policy mitarbeiter_select on public.mitarbeiter for select to authenticated
  using (public.ist_buero() or (profile_id = auth.uid() and public.ist_mitglied()));
create policy mitarbeiter_insert on public.mitarbeiter for insert to authenticated
  with check (public.ist_buero());
create policy mitarbeiter_update on public.mitarbeiter for update to authenticated
  using (public.ist_buero()) with check (public.ist_buero());

-- Kunden
-- created_by direkt prüfen: STABLE-Helfer sehen in INSERT … RETURNING die neue Zeile noch nicht.
create policy kunden_select on public.kunden for select to authenticated
  using (public.darf_kunde_sehen(id) or (created_by = auth.uid() and public.ist_mitglied()));
create policy kunden_insert on public.kunden for insert to authenticated
  with check (public.ist_buero() or (public.aktuelle_mitarbeiter_id() is not null and created_by = auth.uid()));
create policy kunden_update on public.kunden for update to authenticated
  using (public.ist_buero()) with check (public.ist_buero());

-- Einsatzorte
create policy einsatzorte_select on public.einsatzorte for select to authenticated
  using (public.darf_kunde_sehen(customer_id));
create policy einsatzorte_insert on public.einsatzorte for insert to authenticated
  with check (
    public.ist_buero()
    or (public.aktuelle_mitarbeiter_id() is not null and public.darf_kunde_sehen(customer_id))
  );
create policy einsatzorte_update on public.einsatzorte for update to authenticated
  using (public.ist_buero()) with check (public.ist_buero());

-- Aufträge. Mitarbeiter dürfen Aufträge anlegen (auch für per Dublettenprüfung
-- gefundene Bestandskunden) und werden dabei automatisch zugewiesen.
create policy auftraege_select on public.auftraege for select to authenticated
  using (public.darf_auftrag_sehen(id) or (created_by = auth.uid() and public.ist_mitglied()));
create policy auftraege_insert on public.auftraege for insert to authenticated
  with check (
    public.ist_buero()
    or (
      public.aktuelle_mitarbeiter_id() is not null
      and created_by = auth.uid()
      and status in ('geplant', 'in_bearbeitung')
      and public.kunde_ist_aktiv(customer_id)
    )
  );
create policy auftraege_update on public.auftraege for update to authenticated
  using (public.ist_buero()) with check (public.ist_buero());

create policy auftragszuweisungen_select on public.auftragszuweisungen for select to authenticated
  using (public.darf_auftrag_sehen(job_id));
create policy auftragszuweisungen_insert on public.auftragszuweisungen for insert to authenticated
  with check (public.ist_buero());
create policy auftragszuweisungen_delete on public.auftragszuweisungen for delete to authenticated
  using (public.ist_buero());

-- Katalog: nur lesend (Import später serverseitig).
create policy katalogartikel_select on public.katalogartikel for select to authenticated
  using (public.ist_mitglied());

-- Arbeitsberichte: Schreibzugriff ausschließlich über arbeitsbericht_speichern() & Co.
create policy arbeitsberichte_select on public.arbeitsberichte for select to authenticated
  using (public.darf_bericht_sehen(id));
create policy arbeitsbericht_taetigkeiten_select on public.arbeitsbericht_taetigkeiten for select to authenticated
  using (public.darf_bericht_sehen(work_report_id));
create policy arbeitsbericht_material_select on public.arbeitsbericht_material for select to authenticated
  using (public.darf_bericht_sehen(work_report_id));
create policy arbeitsbericht_zeiteintraege_select on public.arbeitsbericht_zeiteintraege for select to authenticated
  using (public.darf_bericht_sehen(work_report_id));

-- Zeiteinträge. Kundenarbeit entsteht nur über Arbeitsberichte; berichtsgebundene
-- Einträge sind direkt nicht änderbar (nur über den Bericht → nachvollziehbar).
create policy zeiteintraege_select on public.zeiteintraege for select to authenticated
  using (
    public.ist_buero()
    or (public.ist_mitglied() and employee_id = public.aktuelle_mitarbeiter_id())
    or exists (select 1 from public.arbeitsbericht_zeiteintraege l where l.time_entry_id = zeiteintraege.id)
  );
create policy zeiteintraege_insert on public.zeiteintraege for insert to authenticated
  with check (
    entry_type <> 'kundenarbeit'
    and (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id())
    and (job_id is null or public.darf_auftrag_sehen(job_id))
  );
create policy zeiteintraege_update on public.zeiteintraege for update to authenticated
  using (
    (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id())
    and not exists (select 1 from public.arbeitsbericht_zeiteintraege l where l.time_entry_id = zeiteintraege.id)
  )
  with check (
    entry_type <> 'kundenarbeit'
    and (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id())
    and (job_id is null or public.darf_auftrag_sehen(job_id))
  );
create policy zeiteintraege_delete on public.zeiteintraege for delete to authenticated
  using (
    (public.ist_buero() or employee_id = public.aktuelle_mitarbeiter_id())
    and not exists (select 1 from public.arbeitsbericht_zeiteintraege l where l.time_entry_id = zeiteintraege.id)
  );

-- Abwesenheiten: Pflege durch das Büro, Mitarbeiter sehen eigene.
create policy fehlzeiten_select on public.fehlzeiten for select to authenticated
  using (public.ist_buero() or (public.ist_mitglied() and employee_id = public.aktuelle_mitarbeiter_id()));
create policy fehlzeiten_insert on public.fehlzeiten for insert to authenticated
  with check (public.ist_buero());
create policy fehlzeiten_update on public.fehlzeiten for update to authenticated
  using (public.ist_buero()) with check (public.ist_buero());
create policy fehlzeiten_delete on public.fehlzeiten for delete to authenticated
  using (public.ist_buero());

-- Audit-Log: nur lesbar (Büro/Admin), Schreiben ausschließlich per Trigger.
create policy aenderungsprotokoll_select on public.aenderungsprotokoll for select to authenticated
  using (public.ist_buero());
revoke insert, update, delete on public.aenderungsprotokoll from authenticated;

-- Tabellen ohne Lösch-Policy können nicht gelöscht werden (Archivierung statt Löschen).

-- ---------------------------------------------------------------------------
-- Auswertungs-View (RLS des Aufrufers gilt: security_invoker)
-- ---------------------------------------------------------------------------
create view public.mitarbeiter_tagesminuten
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
from public.zeiteintraege t
group by t.employee_id, t.entry_date;

grant select on public.mitarbeiter_tagesminuten to authenticated;
revoke all on public.mitarbeiter_tagesminuten from anon;
