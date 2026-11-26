-- Demo-Daten für Vorführungen (Supabase SQL Editor einfügen und „Run“ klicken).
-- Alle Personen, Firmen und Kontaktdaten sind erfunden. Es werden KEINE Logins angelegt.
-- Voraussetzung: Es existiert mindestens ein Admin-Benutzer (Zugänge).
-- Alles lässt sich mit supabase/demo-daten-entfernen.sql restlos wieder löschen
-- (erkennbar an IDs mit dem Muster ...9000-...). Datumsangaben sind relativ zu heute.

do $$
declare
  v_admin uuid;
begin
  select id into v_admin from public.benutzerprofile where 'admin' = any(roles) order by created_at limit 1;
  if v_admin is null then
    raise exception 'Kein Admin-Benutzer gefunden. Bitte zuerst den Admin einrichten.';
  end if;
  if exists (select 1 from public.kunden where id = 'c9000000-0000-4000-8000-000000000001') then
    raise exception 'Demo-Daten sind bereits vorhanden. Zuerst demo-daten-entfernen.sql ausführen.';
  end if;
end;
$$;

insert into public.mitarbeiter (id, profile_id, employee_number, first_name, last_name, employment_role, start_date, weekly_target_minutes, annual_vacation_days) values
  ('e9000000-0000-4000-8000-000000000001', null, '9101', 'Tobias', 'Maier', 'meister', '2012-08-01', 2400, 30),
  ('e9000000-0000-4000-8000-000000000002', null, '9102', 'Jonas', 'Keller', 'geselle', '2018-09-01', 2400, 28),
  ('e9000000-0000-4000-8000-000000000003', null, '9103', 'Lukas', 'Brenner', 'geselle', '2021-02-15', 2400, 28),
  ('e9000000-0000-4000-8000-000000000004', null, '9104', 'Lena', 'Schmid', 'auszubildender', '2024-09-01', 2340, 27),
  ('e9000000-0000-4000-8000-000000000005', null, '9105', 'Mehmet', 'Yılmaz', 'helfer', '2023-05-02', 1800, 26);

insert into public.kunden (id, edison_customer_number, first_name, last_name, company_name, short_name, billing_street, billing_postal_code, billing_city, phone, email, notes) values
  ('c9000000-0000-4000-8000-000000000001', 'D-1001', 'Hans', 'Müller', null, null, 'Lindenweg 4', '89129', 'Langenau', '07345 912345', 'hans.mueller@example.com', 'Schlüssel bei Nachbarin (Nr. 6).'),
  ('c9000000-0000-4000-8000-000000000002', 'D-1002', 'Petra', 'Wagner', null, null, 'Hauptstraße 12', '89073', 'Ulm', '0731 998877', 'p.wagner@example.com', null),
  ('c9000000-0000-4000-8000-000000000003', 'D-1003', null, null, 'Bäckerei Hofmann GmbH', 'Hofmann', 'Marktplatz 3', '89129', 'Langenau', '07345 4455', 'info@baeckerei-hofmann.example.com', 'Arbeiten nur nach 11 Uhr (Backbetrieb).'),
  ('c9000000-0000-4000-8000-000000000004', null, 'Markus', 'Schneider', null, null, 'Am Weiher 9', '89275', 'Elchingen', '0172 5551234', null, null),
  ('c9000000-0000-4000-8000-000000000005', 'D-1005', 'Claudia', 'Roth', 'Wohnbau Donautal GmbH', 'Donautal', 'Augsburger Straße 50', '89231', 'Neu-Ulm', '0731 700100', 'hausverwaltung@wohnbau-donautal.example.com', 'Rechnung immer an Hausverwaltung, Objekt angeben.'),
  ('c9000000-0000-4000-8000-000000000006', 'D-1006', 'Monika', 'Weber', null, null, 'Karlstraße 7', '89143', 'Blaubeuren', '07344 66778', 'monika.weber@example.com', null),
  ('c9000000-0000-4000-8000-000000000007', 'D-1007', null, 'Krause', 'Zahnarztpraxis Dr. Krause', 'Dr. Krause', 'Olgastraße 88', '89073', 'Ulm', '0731 123450', 'praxis@dr-krause.example.com', null);

insert into public.einsatzorte (id, customer_id, label, street, postal_code, city, access_notes)
select gen_random_uuid(), c.id, null, c.billing_street, c.billing_postal_code, c.billing_city, null
from public.kunden c
where c.id between 'c9000000-0000-4000-8000-000000000001' and 'c9000000-0000-4000-8000-000000000007'
  and c.id <> 'c9000000-0000-4000-8000-000000000005';

insert into public.einsatzorte (id, customer_id, label, street, postal_code, city, access_notes) values
  ('d9000000-0000-4000-8000-000000000001', 'c9000000-0000-4000-8000-000000000005', 'Objekt Kantstraße', 'Kantstraße 14', '89231', 'Neu-Ulm', 'Heizraum im UG, Schlüssel beim Hausmeister Hr. Lang.'),
  ('d9000000-0000-4000-8000-000000000002', 'c9000000-0000-4000-8000-000000000005', 'Objekt Lessingweg', 'Lessingweg 3', '89233', 'Neu-Ulm', null);

do $$
declare
  t date := public.berlin_heute();
begin
  insert into public.auftraege (id, customer_id, service_location_id, title, description, category, status, start_date, completion_date)
  select j.id, j.customer_id,
    coalesce(j.loc, (select s.id from public.einsatzorte s where s.customer_id = j.customer_id order by s.created_at limit 1)),
    j.title, j.descr, j.cat, j.status, t + j.start_offset, case when j.done_offset is null then null else t + j.done_offset end
  from (values
    ('b9000000-0000-4000-8000-000000000001'::uuid, 'c9000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Waschtisch austauschen', 'Alten Waschtisch im OG-Bad ersetzen, neue Armatur.', 'sanitaer'::public.auftragskategorie, 'abgeschlossen'::public.auftragsstatus, -12, -8),
    ('b9000000-0000-4000-8000-000000000002', 'c9000000-0000-4000-8000-000000000002', null, 'Heizungswartung Gasbrennwert', 'Jährliche Wartung Viessmann Vitodens 200.', 'wartung', 'abrechnungsbereit', -9, -9),
    ('b9000000-0000-4000-8000-000000000003', 'c9000000-0000-4000-8000-000000000003', null, 'Ablauf Backstube reparieren', 'Bodenablauf verstopft, Geruchsverschluss prüfen.', 'reparatur', 'in_bearbeitung', -3, null),
    ('b9000000-0000-4000-8000-000000000004', 'c9000000-0000-4000-8000-000000000004', null, 'Wärmepumpeninstallation', 'Luft-Wasser-Wärmepumpe 10 kW inkl. Pufferspeicher, Demontage Ölkessel.', 'waermepumpe', 'in_bearbeitung', -14, null),
    ('b9000000-0000-4000-8000-000000000005', 'c9000000-0000-4000-8000-000000000005', 'd9000000-0000-4000-8000-000000000001', 'Badsanierung Whg. 3', 'Komplettsanierung Bad, bodengleiche Dusche.', 'badsanierung', 'in_bearbeitung', -10, null),
    ('b9000000-0000-4000-8000-000000000006', 'c9000000-0000-4000-8000-000000000005', 'd9000000-0000-4000-8000-000000000002', 'Heizungsausfall Lessingweg', 'Störung Brenner, Mieter ohne Warmwasser.', 'kundendienst', 'abgeschlossen', -6, -6),
    ('b9000000-0000-4000-8000-000000000007', 'c9000000-0000-4000-8000-000000000006', null, 'Heizungswartung Öl', 'Wartung Brenner und Tankkontrolle.', 'wartung', 'geplant', 2, null),
    ('b9000000-0000-4000-8000-000000000008', 'c9000000-0000-4000-8000-000000000007', null, 'Lüftungsanlage Filterwechsel', 'Filterwechsel und Funktionsprüfung KWL.', 'lueftung', 'abgeschlossen', -5, -5)
  ) as j(id, customer_id, loc, title, descr, cat, status, start_offset, done_offset);
end;
$$;

insert into public.auftragszuweisungen (job_id, employee_id) values
  ('b9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-000000000002'),
  ('b9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-000000000004'),
  ('b9000000-0000-4000-8000-000000000002', 'e9000000-0000-4000-8000-000000000003'),
  ('b9000000-0000-4000-8000-000000000003', 'e9000000-0000-4000-8000-000000000002'),
  ('b9000000-0000-4000-8000-000000000004', 'e9000000-0000-4000-8000-000000000001'),
  ('b9000000-0000-4000-8000-000000000004', 'e9000000-0000-4000-8000-000000000003'),
  ('b9000000-0000-4000-8000-000000000004', 'e9000000-0000-4000-8000-000000000005'),
  ('b9000000-0000-4000-8000-000000000005', 'e9000000-0000-4000-8000-000000000002'),
  ('b9000000-0000-4000-8000-000000000005', 'e9000000-0000-4000-8000-000000000004'),
  ('b9000000-0000-4000-8000-000000000006', 'e9000000-0000-4000-8000-000000000003'),
  ('b9000000-0000-4000-8000-000000000007', 'e9000000-0000-4000-8000-000000000003'),
  ('b9000000-0000-4000-8000-000000000008', 'e9000000-0000-4000-8000-000000000001');

-- n-ter zurückliegender Werktag (Mo–Fr)
create or replace function pg_temp.wd(p_n integer) returns date language plpgsql as $$
declare
  d date := public.berlin_heute();
  i integer := 0;
begin
  while i < p_n loop
    d := d - 1;
    if extract(isodow from d) < 6 then i := i + 1; end if;
  end loop;
  return d;
end;
$$;

-- Berichte laufen über dieselbe Funktion wie in der App (Bericht und Zeiteinträge bleiben konsistent).
-- Erfasser/Prüfer ist der Admin; die Teilnehmer sind die Demo-Mitarbeiter.
create or replace function pg_temp.demo_bericht(
  p_job uuid, p_days_ago integer, p_activities text[], p_materials jsonb, p_participants jsonb,
  p_submit boolean, p_review text default null, p_comment text default null
) returns void language plpgsql as $$
declare
  v_admin uuid := (select id from public.benutzerprofile where 'admin' = any(roles) order by created_at limit 1);
  v_id uuid := gen_random_uuid();
  v_res jsonb;
begin
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_res := public.arbeitsbericht_speichern(jsonb_build_object(
    'id', v_id, 'mutation_id', gen_random_uuid(), 'expected_version', null, 'job_id', p_job,
    'report_date', pg_temp.wd(p_days_ago), 'submit', p_submit,
    'activities', (select coalesce(jsonb_agg(jsonb_build_object('id', gen_random_uuid(), 'description', a)), '[]') from unnest(p_activities) a),
    'materials', (select coalesce(jsonb_agg(m || jsonb_build_object('id', gen_random_uuid())), '[]') from jsonb_array_elements(p_materials) m),
    'participants', p_participants
  ));
  if p_review is not null then
    perform public.arbeitsbericht_pruefen(v_id, (v_res ->> 'version')::integer, p_review, p_comment);
  end if;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

do $$
declare
  e_tobias constant text := 'e9000000-0000-4000-8000-000000000001';
  e_jonas  constant text := 'e9000000-0000-4000-8000-000000000002';
  e_lukas  constant text := 'e9000000-0000-4000-8000-000000000003';
  e_lena   constant text := 'e9000000-0000-4000-8000-000000000004';
  e_mehmet constant text := 'e9000000-0000-4000-8000-000000000005';
begin
  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000001', 8,
    array['Alten Waschtisch demontiert', 'Neuen Waschtisch montiert', 'Ablaufgarnitur ausgetauscht', 'Dichtheitsprüfung durchgeführt'],
    '[{"description":"Waschtisch 60 cm, weiß","quantity":1,"unit":"Stk","manufacturer":"Villeroy & Boch"},
      {"description":"Einhebelmischer","quantity":1,"unit":"Stk","manufacturer":"Hansgrohe","article_number":"71100000"},
      {"description":"Ablaufgarnitur","quantity":1,"unit":"Stk"},
      {"description":"Eckventil 1/2\"","quantity":2,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 150),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 120)),
    true, 'approve');

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000002', 9,
    array['Brenner gereinigt', 'Abgasmessung durchgeführt', 'Zündelektrode erneuert', 'Anlagendruck geprüft und aufgefüllt'],
    '[{"description":"Zündelektrode","quantity":1,"unit":"Stk","manufacturer":"Viessmann","article_number":"7838114"},
      {"description":"Dichtungssatz Brenner","quantity":1,"unit":"Satz"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 105)),
    true, 'approve');

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000004', 6,
    array['Ölkessel demontiert und entsorgt', 'Öltank gereinigt (Fachfirma koordiniert)', 'Fundament für Außeneinheit vorbereitet'],
    '[{"description":"Entsorgung Altkessel","quantity":1,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 480),
                      jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 480),
                      jsonb_build_object('employee_id', e_mehmet, 'duration_minutes', 420)),
    true, 'approve');

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000004', 3,
    array['Außeneinheit gesetzt', 'Hydraulische Anbindung Pufferspeicher', 'Kondensatleitung verlegt'],
    '[{"description":"Pufferspeicher 300 l","quantity":1,"unit":"Stk","manufacturer":"Weishaupt"},
      {"description":"Kupferrohr 22 mm","quantity":18,"unit":"m"},
      {"description":"Isolierung 22 mm","quantity":18,"unit":"m"},
      {"description":"Pressfitting Bogen 90° 22 mm","quantity":14,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 510),
                      jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 510)),
    true);

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000005', 4,
    array['Fliesen im Duschbereich entfernt', 'Wasserleitungen zurückgebaut', 'Neue Vorwandinstallation gesetzt'],
    '[{"description":"Vorwandelement WC","quantity":1,"unit":"Stk","manufacturer":"Geberit","article_number":"111.300.00.5"},
      {"description":"Mehrschichtverbundrohr 16 mm","quantity":25,"unit":"m"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 450),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 450)),
    true, 'request_correction', 'Bitte verbautes Material vollständig angeben (Fittings fehlen).');

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000006', 6,
    array['Störung Brenner analysiert', 'Ionisationselektrode getauscht', 'Probelauf, Warmwasser wieder verfügbar'],
    '[{"description":"Ionisationselektrode","quantity":1,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 90)),
    true);

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000008', 5,
    array['Filter Zu- und Abluft gewechselt', 'Volumenströme geprüft'],
    '[{"description":"Filterset G4/F7","quantity":1,"unit":"Satz"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 75)),
    true, 'approve');

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000003', 1,
    array['Bodenablauf mit Spirale gereinigt', 'Geruchsverschluss demontiert und gereinigt'],
    '[]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 120)),
    true);

  perform pg_temp.demo_bericht('b9000000-0000-4000-8000-000000000005', 1,
    array['Abdichtung Duschbereich vorbereitet'],
    '[{"description":"Dichtband","quantity":1,"unit":"Rolle"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 300),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 300)),
    false);
end;
$$;

-- Weitere Zeiten (Fahrt, Lager, Pause)
insert into public.zeiteintraege (employee_id, entry_date, entry_type, job_id, duration_minutes, billable, note)
values
  ('e9000000-0000-4000-8000-000000000002', pg_temp.wd(8), 'fahrzeit', 'b9000000-0000-4000-8000-000000000001', 25, true, 'Anfahrt Langenau'),
  ('e9000000-0000-4000-8000-000000000002', pg_temp.wd(8), 'lager', null, 60, false, 'Material kommissioniert'),
  ('e9000000-0000-4000-8000-000000000003', pg_temp.wd(9), 'fahrzeit', 'b9000000-0000-4000-8000-000000000002', 35, true, null),
  ('e9000000-0000-4000-8000-000000000003', pg_temp.wd(9), 'materialbeschaffung', null, 45, false, 'Großhandel Ulm'),
  ('e9000000-0000-4000-8000-000000000002', pg_temp.wd(1), 'intern', null, 60, false, 'Fahrzeugpflege');

insert into public.fehlzeiten (employee_id, absence_type, start_date, end_date, half_day, note) values
  ('e9000000-0000-4000-8000-000000000004', 'berufsschule', pg_temp.wd(2), pg_temp.wd(2), false, 'Blockunterricht'),
  ('e9000000-0000-4000-8000-000000000005', 'krank', pg_temp.wd(2), pg_temp.wd(1), false, null),
  ('e9000000-0000-4000-8000-000000000003', 'urlaub', public.berlin_heute() + 7, public.berlin_heute() + 11, false, 'Genehmigt');

-- Aus den Berichten automatisch entstandene Arbeitstage werden durch die Erfassungszeiten unten ersetzt.
delete from public.arbeitstage where automatisch and employee_id::text like 'e9000000-%';

-- Arbeitstage (Beginn/Ende/Pause) der letzten 5 Wochen für die Demo-Mitarbeiter, ohne heute.
-- Offen gelassen: Lukas Brenner am letzten Werktag (zeigt die Erinnerung „Arbeitszeit fehlt“).
do $$
declare
  e record;
  d date;
  v_start time;
  v_end time;
  v_alloc integer;
begin
  for e in select id, employee_number, start_date from public.mitarbeiter
           where id between 'e9000000-0000-4000-8000-000000000001' and 'e9000000-0000-4000-8000-000000000005' loop
    for d in select generate_series(public.berlin_heute() - 35, public.berlin_heute() - 1, interval '1 day')::date loop
      continue when extract(isodow from d) > 5;
      continue when d < e.start_date;
      continue when exists (select 1 from public.fehlzeiten a where a.employee_id = e.id and d between a.start_date and a.end_date);
      continue when e.employee_number = '9103' and d = pg_temp.wd(1);

      v_start := '07:30';
      v_end := case when extract(isodow from d) = 5 then '13:30'::time else '16:00'::time end;

      select coalesce(sum(duration_minutes), 0) into v_alloc
      from public.zeiteintraege where employee_id = e.id and entry_date = d and entry_type <> 'pause';
      if v_alloc > extract(epoch from (v_end - v_start)) / 60 then
        v_end := v_start + make_interval(mins => (ceil(v_alloc / 15.0) * 15)::integer);
      end if;

      insert into public.arbeitstage (employee_id, work_date, start_time, end_time, break_minutes, created_at)
      values (e.id, d, v_start, v_end, 0, (d + time '17:30') at time zone 'Europe/Berlin');
    end loop;
  end loop;
end;
$$;

insert into public.ortskuerzel (city, abbreviation) values
  ('Neu-Ulm', 'NU'), ('Blaubeuren', 'Blb')
on conflict (city) do nothing;
