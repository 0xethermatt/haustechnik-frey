-- Fachfunktionen (RPC). Alle Schreibvorgänge an Arbeitsberichten laufen hierüber,
-- damit Bericht, Positionen und Zeiteinträge immer in EINER Transaktion konsistent bleiben.

create or replace function public.berlin_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Berlin')::date;
$$;

create or replace function public.raise_app_error(p_code text, p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_code, detail = p_message;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_work_report: Anlegen/Ändern (optional Einreichen) in einem Schritt.
-- Idempotent über mutation_id, konfliktsicher über expected_version.
-- Zeiteinträge werden pro Teilnehmer aktualisiert statt neu angelegt.
-- ---------------------------------------------------------------------------
create or replace function public.save_work_report(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_office boolean := public.is_office();
  v_employee uuid := public.current_employee_id();
  v_id uuid := (p ->> 'id')::uuid;
  v_mutation uuid := (p ->> 'mutation_id')::uuid;
  v_expected integer := (p ->> 'expected_version')::integer;
  v_job_id uuid := (p ->> 'job_id')::uuid;
  v_date date := (p ->> 'report_date')::date;
  v_submit boolean := coalesce((p ->> 'submit')::boolean, false);
  v_reason text := nullif(trim(coalesce(p ->> 'correction_reason', '')), '');
  v_activities jsonb := coalesce(p -> 'activities', '[]'::jsonb);
  v_materials jsonb := coalesce(p -> 'materials', '[]'::jsonb);
  v_participants jsonb := coalesce(p -> 'participants', '[]'::jsonb);
  v_report public.work_reports%rowtype;
  v_job public.jobs%rowtype;
  v_exists boolean;
  v_item jsonb;
  v_pos integer;
  v_entry_id uuid;
  v_started timestamptz;
  v_ended timestamptz;
  v_break integer;
  v_duration integer;
  v_participant_ids uuid[];
  v_new_status public.report_status;
begin
  if v_uid is null or not public.is_member() then
    perform public.raise_app_error('FORBIDDEN', 'Nicht angemeldet oder keine Berechtigung.');
  end if;
  if not v_is_office and v_employee is null then
    perform public.raise_app_error('FORBIDDEN', 'Kein aktiver Mitarbeiter mit diesem Konto verknüpft.');
  end if;
  if v_id is null or v_mutation is null or v_job_id is null or v_date is null then
    perform public.raise_app_error('INVALID', 'Bericht-ID, Mutations-ID, Auftrag und Datum sind erforderlich.');
  end if;
  if jsonb_typeof(v_activities) <> 'array' or jsonb_typeof(v_materials) <> 'array'
     or jsonb_typeof(v_participants) <> 'array' then
    perform public.raise_app_error('INVALID', 'Ungültiges Datenformat.');
  end if;
  if v_date > public.berlin_today() then
    perform public.raise_app_error('INVALID', 'Das Berichtsdatum darf nicht in der Zukunft liegen.');
  end if;

  select * into v_report from public.work_reports where id = v_id for update;
  v_exists := found;

  if v_exists then
    -- Wiederholte Anfrage (z. B. Antwort ging im Funkloch verloren): nichts doppelt ausführen.
    if v_report.last_mutation_id = v_mutation then
      return jsonb_build_object('id', v_report.id, 'version', v_report.version,
        'status', v_report.status, 'report_number', v_report.report_number, 'replayed', true);
    end if;
    if v_expected is null or v_expected <> v_report.version then
      perform public.raise_app_error('VERSION_CONFLICT',
        'Der Bericht wurde zwischenzeitlich geändert. Bitte neu laden.');
    end if;
    if v_is_office then
      if v_report.status = 'freigegeben' and (v_reason is null or length(v_reason) < 5) then
        perform public.raise_app_error('REASON_REQUIRED',
          'Änderungen an freigegebenen Berichten benötigen eine Begründung.');
      end if;
    else
      if v_report.created_by <> v_uid then
        perform public.raise_app_error('FORBIDDEN', 'Nur der Ersteller kann diesen Bericht bearbeiten.');
      end if;
      if v_report.status not in ('entwurf', 'korrektur_erforderlich') then
        perform public.raise_app_error('LOCKED', 'Eingereichte Berichte können nicht mehr geändert werden.');
      end if;
    end if;
  end if;

  select * into v_job from public.jobs where id = v_job_id;
  if not found then
    perform public.raise_app_error('INVALID', 'Auftrag nicht gefunden.');
  end if;
  if not public.can_view_job(v_job_id) then
    perform public.raise_app_error('FORBIDDEN', 'Kein Zugriff auf diesen Auftrag.');
  end if;
  if v_job.archived_at is not null or v_job.status = 'abgerechnet' then
    if not (v_exists and v_report.job_id = v_job_id and v_is_office) then
      perform public.raise_app_error('INVALID', 'Für diesen Auftrag können keine Berichte mehr erfasst werden.');
    end if;
  end if;
  if not v_is_office and v_job.status = 'abrechnungsbereit' then
    perform public.raise_app_error('INVALID', 'Auftrag ist bereits abrechnungsbereit. Bitte Büro kontaktieren.');
  end if;

  perform set_config('app.change_reason', coalesce(v_reason, ''), true);

  if v_submit then
    if jsonb_array_length(v_activities) = 0 then
      perform public.raise_app_error('INVALID', 'Mindestens eine ausgeführte Arbeit ist erforderlich.');
    end if;
    if jsonb_array_length(v_participants) = 0 then
      perform public.raise_app_error('INVALID', 'Mindestens ein Mitarbeiter mit Arbeitszeit ist erforderlich.');
    end if;
  end if;

  -- Status bestimmen
  if v_submit and (not v_exists or v_report.status in ('entwurf', 'korrektur_erforderlich')) then
    v_new_status := 'eingereicht';
  elsif v_exists then
    v_new_status := v_report.status;
  else
    v_new_status := 'entwurf';
  end if;

  if v_exists then
    update public.work_reports set
      job_id = v_job_id,
      report_date = v_date,
      internal_notes = nullif(trim(coalesce(p ->> 'internal_notes', '')), ''),
      status = v_new_status,
      submitted_at = case when v_new_status = 'eingereicht' and v_report.status <> 'eingereicht' then now() else submitted_at end,
      submitted_by = case when v_new_status = 'eingereicht' and v_report.status <> 'eingereicht' then v_uid else submitted_by end,
      version = version + 1,
      last_mutation_id = v_mutation
    where id = v_id
    returning * into v_report;
  else
    insert into public.work_reports (id, job_id, report_date, status, internal_notes, created_by,
      submitted_at, submitted_by, last_mutation_id)
    values (v_id, v_job_id, v_date, v_new_status, nullif(trim(coalesce(p ->> 'internal_notes', '')), ''), v_uid,
      case when v_new_status = 'eingereicht' then now() end,
      case when v_new_status = 'eingereicht' then v_uid end,
      v_mutation)
    returning * into v_report;
  end if;

  -- Tätigkeiten (Upsert nach ID, entfernte Positionen löschen)
  delete from public.work_report_activities a
  where a.work_report_id = v_id
    and a.id not in (
      select (x ->> 'id')::uuid from jsonb_array_elements(v_activities) x where x ->> 'id' is not null
    );
  v_pos := 0;
  for v_item in select * from jsonb_array_elements(v_activities) loop
    if length(trim(coalesce(v_item ->> 'description', ''))) = 0 then
      perform public.raise_app_error('INVALID', 'Leere Tätigkeitsbeschreibung.');
    end if;
    insert into public.work_report_activities (id, work_report_id, position, description)
    values (coalesce((v_item ->> 'id')::uuid, gen_random_uuid()), v_id, v_pos, trim(v_item ->> 'description'))
    on conflict (id) do update set position = excluded.position, description = excluded.description
      where public.work_report_activities.work_report_id = v_id;
    v_pos := v_pos + 1;
  end loop;

  -- Material
  delete from public.work_report_materials m
  where m.work_report_id = v_id
    and m.id not in (
      select (x ->> 'id')::uuid from jsonb_array_elements(v_materials) x where x ->> 'id' is not null
    );
  v_pos := 0;
  for v_item in select * from jsonb_array_elements(v_materials) loop
    insert into public.work_report_materials (id, work_report_id, position, catalog_article_id, description,
      quantity, unit, manufacturer, article_number, supplier_article_number, supplier_reference)
    values (
      coalesce((v_item ->> 'id')::uuid, gen_random_uuid()), v_id, v_pos,
      (v_item ->> 'catalog_article_id')::uuid,
      trim(v_item ->> 'description'),
      (v_item ->> 'quantity')::numeric,
      trim(v_item ->> 'unit'),
      nullif(trim(coalesce(v_item ->> 'manufacturer', '')), ''),
      nullif(trim(coalesce(v_item ->> 'article_number', '')), ''),
      nullif(trim(coalesce(v_item ->> 'supplier_article_number', '')), ''),
      nullif(trim(coalesce(v_item ->> 'supplier_reference', '')), '')
    )
    on conflict (id) do update set
      position = excluded.position, catalog_article_id = excluded.catalog_article_id,
      description = excluded.description, quantity = excluded.quantity, unit = excluded.unit,
      manufacturer = excluded.manufacturer, article_number = excluded.article_number,
      supplier_article_number = excluded.supplier_article_number, supplier_reference = excluded.supplier_reference
      where public.work_report_materials.work_report_id = v_id;
    v_pos := v_pos + 1;
  end loop;

  -- Teilnehmer & Arbeitszeiten → zentrale Zeiteinträge (aktualisieren statt duplizieren)
  select coalesce(array_agg((x ->> 'employee_id')::uuid), '{}') into v_participant_ids
  from jsonb_array_elements(v_participants) x;

  if cardinality(v_participant_ids) <> (select count(distinct u) from unnest(v_participant_ids) u) then
    perform public.raise_app_error('INVALID', 'Ein Mitarbeiter ist mehrfach eingetragen.');
  end if;

  -- Entfernte Teilnehmer: Verknüpfung und Zeiteintrag löschen
  with removed as (
    delete from public.work_report_time_entries l
    where l.work_report_id = v_id and not (l.employee_id = any (v_participant_ids))
    returning l.time_entry_id
  )
  delete from public.time_entries t using removed r where t.id = r.time_entry_id;

  for v_item in select * from jsonb_array_elements(v_participants) loop
    if not exists (
      select 1 from public.employees e where e.id = (v_item ->> 'employee_id')::uuid and e.is_active
    ) and not exists (
      select 1 from public.work_report_time_entries l
      where l.work_report_id = v_id and l.employee_id = (v_item ->> 'employee_id')::uuid
    ) then
      perform public.raise_app_error('INVALID', 'Unbekannter oder inaktiver Mitarbeiter.');
    end if;

    v_started := (v_item ->> 'started_at')::timestamptz;
    v_ended := (v_item ->> 'ended_at')::timestamptz;
    v_break := coalesce((v_item ->> 'break_minutes')::integer, 0);
    if v_started is not null and v_ended is not null then
      v_duration := (extract(epoch from (v_ended - v_started))::integer / 60) - v_break;
    else
      v_started := null;
      v_ended := null;
      v_duration := (v_item ->> 'duration_minutes')::integer;
    end if;
    if v_duration is null or v_duration <= 0 or v_duration > 1440 then
      perform public.raise_app_error('INVALID', 'Ungültige Arbeitszeit.');
    end if;

    select l.time_entry_id into v_entry_id
    from public.work_report_time_entries l
    where l.work_report_id = v_id and l.employee_id = (v_item ->> 'employee_id')::uuid;

    if v_entry_id is not null then
      update public.time_entries set
        entry_date = v_date, entry_type = 'kundenarbeit', job_id = v_job_id,
        started_at = v_started, ended_at = v_ended, break_minutes = v_break,
        duration_minutes = v_duration, billable = true
      where id = v_entry_id;
    else
      insert into public.time_entries (employee_id, entry_date, entry_type, job_id, started_at, ended_at,
        break_minutes, duration_minutes, billable, created_by)
      values ((v_item ->> 'employee_id')::uuid, v_date, 'kundenarbeit', v_job_id, v_started, v_ended,
        v_break, v_duration, true, v_uid)
      returning id into v_entry_id;
      insert into public.work_report_time_entries (work_report_id, time_entry_id, employee_id)
      values (v_id, v_entry_id, (v_item ->> 'employee_id')::uuid);
    end if;
  end loop;

  if v_job.status = 'geplant' then
    update public.jobs set status = 'in_bearbeitung' where id = v_job_id;
  end if;

  return jsonb_build_object('id', v_report.id, 'version', v_report.version,
    'status', v_report.status, 'report_number', v_report.report_number, 'replayed', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Prüfung durch das Büro
-- ---------------------------------------------------------------------------
create or replace function public.review_work_report(
  p_report_id uuid,
  p_expected_version integer,
  p_decision text,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.work_reports%rowtype;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
begin
  if not public.is_office() then
    perform public.raise_app_error('FORBIDDEN', 'Nur Büro oder Admin dürfen Berichte prüfen.');
  end if;

  select * into v_report from public.work_reports where id = p_report_id for update;
  if not found then
    perform public.raise_app_error('NOT_FOUND', 'Bericht nicht gefunden.');
  end if;
  if v_report.version <> p_expected_version then
    perform public.raise_app_error('VERSION_CONFLICT', 'Der Bericht wurde zwischenzeitlich geändert. Bitte neu laden.');
  end if;

  if p_decision = 'approve' then
    if v_report.status <> 'eingereicht' then
      perform public.raise_app_error('INVALID_STATE', 'Nur eingereichte Berichte können freigegeben werden.');
    end if;
    perform set_config('app.change_reason', coalesce(v_comment, ''), true);
    update public.work_reports set status = 'freigegeben', reviewed_at = now(), reviewed_by = auth.uid(),
      review_comment = v_comment, version = version + 1
    where id = p_report_id returning * into v_report;
  elsif p_decision = 'request_correction' then
    if v_report.status not in ('eingereicht', 'freigegeben') then
      perform public.raise_app_error('INVALID_STATE', 'Korrektur kann nur für eingereichte oder freigegebene Berichte angefordert werden.');
    end if;
    if v_comment is null then
      perform public.raise_app_error('REASON_REQUIRED', 'Bitte angeben, was korrigiert werden soll.');
    end if;
    perform set_config('app.change_reason', v_comment, true);
    update public.work_reports set status = 'korrektur_erforderlich', reviewed_at = now(), reviewed_by = auth.uid(),
      review_comment = v_comment, version = version + 1
    where id = p_report_id returning * into v_report;
  else
    perform public.raise_app_error('INVALID', 'Unbekannte Entscheidung.');
  end if;

  return jsonb_build_object('id', v_report.id, 'version', v_report.version, 'status', v_report.status);
end;
$$;

-- ---------------------------------------------------------------------------
-- Entwurf verwerfen (inkl. zugehöriger Zeiteinträge)
-- ---------------------------------------------------------------------------
create or replace function public.delete_work_report_draft(p_report_id uuid, p_expected_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.work_reports%rowtype;
begin
  select * into v_report from public.work_reports where id = p_report_id for update;
  if not found then
    perform public.raise_app_error('NOT_FOUND', 'Bericht nicht gefunden.');
  end if;
  if not (public.is_office() or (v_report.created_by = auth.uid() and public.is_member())) then
    perform public.raise_app_error('FORBIDDEN', 'Keine Berechtigung.');
  end if;
  if v_report.status <> 'entwurf' then
    perform public.raise_app_error('LOCKED', 'Nur Entwürfe können verworfen werden.');
  end if;
  if v_report.version <> p_expected_version then
    perform public.raise_app_error('VERSION_CONFLICT', 'Der Bericht wurde zwischenzeitlich geändert.');
  end if;

  with removed as (
    delete from public.work_report_time_entries l where l.work_report_id = p_report_id
    returning l.time_entry_id
  )
  delete from public.time_entries t using removed r where t.id = r.time_entry_id;
  delete from public.work_reports where id = p_report_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dublettenprüfung Kunden (liefert bewusst nur minimale Daten)
-- ---------------------------------------------------------------------------
create or replace function public.find_customer_duplicates(
  p_first_name text default null,
  p_last_name text default null,
  p_company_name text default null,
  p_phone text default null,
  p_email text default null,
  p_postal_code text default null
)
returns table (
  id uuid,
  customer_number integer,
  display_name text,
  postal_code text,
  city text,
  match_reason text,
  score real,
  service_locations jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      lower(trim(coalesce(p_first_name, '') || ' ' || coalesce(p_last_name, ''))) as person,
      lower(trim(coalesce(p_last_name, ''))) as last_name,
      lower(trim(coalesce(p_company_name, ''))) as company,
      nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '') as phone,
      lower(nullif(trim(coalesce(p_email, '')), '')) as email,
      nullif(trim(coalesce(p_postal_code, '')), '') as postal_code
  ),
  scored as (
    select c.*,
      case
        when i.phone is not null and length(i.phone) >= 6 and c.phone_digits = i.phone then 'Telefonnummer'
        when i.email is not null and lower(c.email) = i.email then 'E-Mail'
        when i.company <> '' and extensions.similarity(lower(coalesce(c.company_name, '')), i.company) >= 0.6 then 'Firmenname'
        when i.last_name <> '' and extensions.similarity(
               lower(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))), i.person) >= 0.55
             and (i.postal_code is null or c.billing_postal_code = i.postal_code
                  or exists (select 1 from public.service_locations s where s.customer_id = c.id and s.postal_code = i.postal_code))
          then 'Name und PLZ'
        when i.last_name <> '' and lower(coalesce(c.last_name, '')) = i.last_name and i.postal_code is not null
             and c.billing_postal_code = i.postal_code then 'Nachname und PLZ'
      end as reason,
      greatest(
        extensions.similarity(lower(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))), i.person),
        extensions.similarity(lower(coalesce(c.company_name, '')), i.company)
      ) as sim
    from public.customers c, input i
    where c.archived_at is null
  )
  select s.id, s.customer_number,
    coalesce(nullif(s.company_name, ''), trim(coalesce(s.first_name, '') || ' ' || coalesce(s.last_name, ''))),
    s.billing_postal_code, s.billing_city, s.reason, s.sim,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'label', l.label, 'street', l.street,
        'postal_code', l.postal_code, 'city', l.city) order by l.created_at)
      from public.service_locations l where l.customer_id = s.id and l.archived_at is null
    ), '[]'::jsonb)
  from scored s
  where s.reason is not null and public.is_member()
  order by (s.reason in ('Telefonnummer', 'E-Mail')) desc, s.sim desc
  limit 5;
$$;

-- ---------------------------------------------------------------------------
-- Benutzerverwaltung (nur Admin). Einladung erfolgt serverseitig über die Auth-API.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_access(
  p_user_id uuid,
  p_roles public.app_role[],
  p_is_active boolean,
  p_display_name text default null,
  p_employee_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    perform public.raise_app_error('FORBIDDEN', 'Nur Administratoren dürfen Zugänge verwalten.');
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    perform public.raise_app_error('NOT_FOUND', 'Benutzer nicht gefunden.');
  end if;

  update public.profiles set
    roles = (select coalesce(array_agg(distinct r), '{}') from unnest(p_roles) r),
    is_active = p_is_active,
    display_name = coalesce(nullif(trim(p_display_name), ''), display_name)
  where id = p_user_id;

  if not exists (
    select 1 from public.profiles where is_active and 'admin' = any (roles)
  ) then
    perform public.raise_app_error('INVALID', 'Es muss mindestens ein aktiver Administrator bestehen bleiben.');
  end if;

  update public.employees set profile_id = null
  where profile_id = p_user_id and (p_employee_id is null or id <> p_employee_id);
  if p_employee_id is not null then
    update public.employees set profile_id = p_user_id where id = p_employee_id;
  end if;
end;
$$;

revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.berlin_today(),
  public.save_work_report(jsonb),
  public.review_work_report(uuid, integer, text, text),
  public.delete_work_report_draft(uuid, integer),
  public.find_customer_duplicates(text, text, text, text, text, text),
  public.admin_set_user_access(uuid, public.app_role[], boolean, text, uuid)
  to authenticated;

-- Sichtbarkeits-Helfer aus der RLS-Migration wieder für angemeldete Benutzer freigeben.
grant execute on function
  public.has_role(public.app_role), public.is_admin(), public.is_office(), public.is_member(),
  public.current_employee_id(), public.can_view_job(uuid), public.can_view_customer(uuid),
  public.can_view_report(uuid), public.customer_is_active(uuid), public.employee_directory()
  to authenticated;
