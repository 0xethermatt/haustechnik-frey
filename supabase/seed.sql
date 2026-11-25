-- Fiktive Testdaten für die lokale Entwicklung (supabase db reset).
-- NICHT in Produktion einspielen. Alle Personen, Firmen und Kontaktdaten sind erfunden.
-- Lokales Passwort für alle Testkonten: Frey-Demo-2026!

do $$
declare
  v_pw text := extensions.crypt('Frey-Demo-2026!', extensions.gen_salt('bf'));
  u record;
begin
  for u in
    select * from (values
      ('a1000000-0000-4000-8000-000000000001'::uuid, 'andreas.frey@frey-demo.test', 'Andreas Frey', '{admin,office,employee}'::public.app_role[]),
      ('a1000000-0000-4000-8000-000000000002'::uuid, 'sabine.frey@frey-demo.test', 'Sabine Frey', '{office}'::public.app_role[]),
      ('a1000000-0000-4000-8000-000000000003'::uuid, 'jonas.keller@frey-demo.test', 'Jonas Keller', '{employee}'::public.app_role[]),
      ('a1000000-0000-4000-8000-000000000004'::uuid, 'lukas.brenner@frey-demo.test', 'Lukas Brenner', '{employee}'::public.app_role[]),
      ('a1000000-0000-4000-8000-000000000005'::uuid, 'tobias.maier@frey-demo.test', 'Tobias Maier', '{employee}'::public.app_role[])
    ) as t(id, email, name, roles)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, v_pw, now(),
      now(), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', u.name),
      '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now());
    update public.profiles set roles = u.roles, display_name = u.name where id = u.id;
  end loop;
end;
$$;

insert into public.employees (id, profile_id, employee_number, first_name, last_name, employment_role, start_date, weekly_target_minutes, annual_vacation_days) values
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '100', 'Andreas', 'Frey', 'meister', '1994-04-01', 2400, 30),
  ('e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000005', '101', 'Tobias', 'Maier', 'meister', '2012-08-01', 2400, 30),
  ('e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', '103', 'Jonas', 'Keller', 'geselle', '2018-09-01', 2400, 28),
  ('e1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004', '104', 'Lukas', 'Brenner', 'geselle', '2021-02-15', 2400, 28),
  ('e1000000-0000-4000-8000-000000000005', null, '201', 'Lena', 'Schmid', 'auszubildender', '2024-09-01', 2340, 27),
  ('e1000000-0000-4000-8000-000000000006', null, '301', 'Mehmet', 'Yılmaz', 'helfer', '2023-05-02', 1800, 26),
  ('e1000000-0000-4000-8000-000000000007', null, '401', 'Sabine', 'Frey', 'buero', '1998-01-01', 1200, 30);

insert into public.customers (id, edison_customer_number, first_name, last_name, company_name, billing_street, billing_postal_code, billing_city, phone, email, notes) values
  ('c1000000-0000-4000-8000-000000000001', 'E-4711', 'Hans', 'Müller', null, 'Lindenweg 4', '89129', 'Langenau', '07345 912345', 'hans.mueller@example.com', 'Schlüssel bei Nachbarin (Nr. 6).'),
  ('c1000000-0000-4000-8000-000000000002', 'E-4712', 'Petra', 'Wagner', null, 'Hauptstraße 12', '89073', 'Ulm', '0731 998877', 'p.wagner@example.com', null),
  ('c1000000-0000-4000-8000-000000000003', 'E-5120', null, null, 'Bäckerei Hofmann GmbH', 'Marktplatz 3', '89129', 'Langenau', '07345 4455', 'info@baeckerei-hofmann.example.com', 'Arbeiten nur nach 11 Uhr (Backbetrieb).'),
  ('c1000000-0000-4000-8000-000000000004', null, 'Markus', 'Schneider', null, 'Am Weiher 9', '89275', 'Elchingen', '0172 5551234', null, null),
  ('c1000000-0000-4000-8000-000000000005', 'E-6001', 'Claudia', 'Roth', 'Wohnbau Donautal GmbH', 'Augsburger Straße 50', '89231', 'Neu-Ulm', '0731 700100', 'hausverwaltung@wohnbau-donautal.example.com', 'Rechnung immer an Hausverwaltung, Objekt angeben.'),
  ('c1000000-0000-4000-8000-000000000006', null, 'Gerhard', 'Fischer', null, 'Brenzstraße 21', '89542', 'Herbrechtingen', '07324 88123', null, null),
  ('c1000000-0000-4000-8000-000000000007', 'E-4890', 'Monika', 'Weber', null, 'Karlstraße 7', '89143', 'Blaubeuren', '07344 66778', 'monika.weber@example.com', null),
  ('c1000000-0000-4000-8000-000000000008', null, 'Thomas', 'Becker', null, 'Bahnhofstraße 15', '89168', 'Niederstotzingen', '07325 9911', null, 'Hund im Garten.'),
  ('c1000000-0000-4000-8000-000000000009', 'E-5333', null, 'Krause', 'Zahnarztpraxis Dr. Krause', 'Olgastraße 88', '89073', 'Ulm', '0731 123450', 'praxis@dr-krause.example.com', null),
  ('c1000000-0000-4000-8000-000000000010', null, 'Ingrid', 'Schulz', null, 'Kirchgasse 2', '89129', 'Langenau', '07345 3210', null, null);

update public.customers set archived_at = now() - interval '200 days' where id = 'c1000000-0000-4000-8000-000000000010';

insert into public.service_locations (id, customer_id, label, street, postal_code, city, access_notes)
select gen_random_uuid(), c.id, null, c.billing_street, c.billing_postal_code, c.billing_city, null
from public.customers c where c.id <> 'c1000000-0000-4000-8000-000000000005';

insert into public.service_locations (id, customer_id, label, street, postal_code, city, access_notes) values
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000005', 'Objekt Kantstraße', 'Kantstraße 14', '89231', 'Neu-Ulm', 'Heizraum im UG, Schlüssel beim Hausmeister Hr. Lang.'),
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', 'Objekt Lessingweg', 'Lessingweg 3', '89233', 'Neu-Ulm', null);

-- Aufträge (Datumsangaben relativ zum Einspieldatum)
do $$
declare
  t date := public.berlin_today();
begin
  insert into public.jobs (id, customer_id, service_location_id, title, description, category, status, start_date, completion_date)
  select j.id, j.customer_id,
    coalesce(j.loc, (select s.id from public.service_locations s where s.customer_id = j.customer_id order by s.created_at limit 1)),
    j.title, j.descr, j.cat, j.status, t + j.start_offset, case when j.done_offset is null then null else t + j.done_offset end
  from (values
    ('b1000000-0000-4000-8000-000000000001'::uuid, 'c1000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Waschtisch austauschen', 'Alten Waschtisch im OG-Bad ersetzen, neue Armatur.', 'sanitaer'::public.job_category, 'abgeschlossen'::public.job_status, -12, -8),
    ('b1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', null, 'Heizungswartung Gasbrennwert', 'Jährliche Wartung Viessmann Vitodens 200.', 'wartung', 'abgeschlossen', -9, -9),
    ('b1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', null, 'Ablauf Backstube reparieren', 'Bodenablauf verstopft, Geruchsverschluss prüfen.', 'reparatur', 'in_bearbeitung', -3, null),
    ('b1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', null, 'Wärmepumpeninstallation', 'Luft-Wasser-Wärmepumpe 10 kW inkl. Pufferspeicher, Demontage Ölkessel.', 'waermepumpe', 'in_bearbeitung', -14, null),
    ('b1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000001', 'Badsanierung Whg. 3', 'Komplettsanierung Bad, bodengleiche Dusche.', 'badsanierung', 'in_bearbeitung', -10, null),
    ('b1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002', 'Heizungsausfall Lessingweg', 'Störung Brenner, Mieter ohne Warmwasser.', 'kundendienst', 'abgeschlossen', -6, -6),
    ('b1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000006', null, 'Wasserhahn austauschen Küche', null, 'kundendienst', 'abgerechnet', -30, -29),
    ('b1000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000007', null, 'Heizungswartung Öl', 'Wartung Brenner und Tankkontrolle.', 'wartung', 'geplant', 2, null),
    ('b1000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000009', null, 'Lüftungsanlage Filterwechsel', 'Filterwechsel und Funktionsprüfung KWL.', 'lueftung', 'abgeschlossen', -5, -5),
    ('b1000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000008', null, 'Solarthermie Störung', 'Solarpumpe läuft nicht an.', 'solar', 'geplant', 1, null)
  ) as j(id, customer_id, loc, title, descr, cat, status, start_offset, done_offset);
end;
$$;

insert into public.job_assignments (job_id, employee_id) values
  ('b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003'),
  ('b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000005'),
  ('b1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000004'),
  ('b1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003'),
  ('b1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000002'),
  ('b1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004'),
  ('b1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000006'),
  ('b1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000003'),
  ('b1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000005'),
  ('b1000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000004'),
  ('b1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000003'),
  ('b1000000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000004'),
  ('b1000000-0000-4000-8000-000000000009', 'e1000000-0000-4000-8000-000000000002'),
  ('b1000000-0000-4000-8000-000000000010', 'e1000000-0000-4000-8000-000000000003');

-- n-ter zurückliegender Werktag (Mo–Fr), damit Testdaten nicht auf Wochenenden fallen
create or replace function pg_temp.wd(p_n integer) returns date language plpgsql as $$
declare
  d date := public.berlin_today();
  i integer := 0;
begin
  while i < p_n loop
    d := d - 1;
    if extract(isodow from d) < 6 then i := i + 1; end if;
  end loop;
  return d;
end;
$$;

-- Arbeitsberichte werden über dieselbe Funktion erzeugt wie in der App,
-- damit Bericht und Zeiteinträge garantiert konsistent sind.
create or replace function pg_temp.seed_report(
  p_user uuid, p_job uuid, p_days_ago integer, p_activities text[], p_materials jsonb,
  p_participants jsonb, p_submit boolean, p_review text default null, p_comment text default null
) returns uuid language plpgsql as $$
declare
  v_id uuid := gen_random_uuid();
  v_res jsonb;
  v_date date := pg_temp.wd(p_days_ago);
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  v_res := public.save_work_report(jsonb_build_object(
    'id', v_id, 'mutation_id', gen_random_uuid(), 'expected_version', null, 'job_id', p_job,
    'report_date', v_date, 'submit', p_submit,
    'activities', (select coalesce(jsonb_agg(jsonb_build_object('id', gen_random_uuid(), 'description', a)), '[]') from unnest(p_activities) a),
    'materials', (select coalesce(jsonb_agg(m || jsonb_build_object('id', gen_random_uuid())), '[]') from jsonb_array_elements(p_materials) m),
    'participants', p_participants
  ));
  if p_review is not null then
    perform set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
    perform public.review_work_report(v_id, (v_res ->> 'version')::integer, p_review, p_comment);
  end if;
  perform set_config('request.jwt.claim.sub', '', true);
  return v_id;
end;
$$;

do $$
declare
  jonas constant uuid := 'a1000000-0000-4000-8000-000000000003';
  lukas constant uuid := 'a1000000-0000-4000-8000-000000000004';
  tobias constant uuid := 'a1000000-0000-4000-8000-000000000005';
  e_tobias constant text := 'e1000000-0000-4000-8000-000000000002';
  e_jonas constant text := 'e1000000-0000-4000-8000-000000000003';
  e_lukas constant text := 'e1000000-0000-4000-8000-000000000004';
  e_lena constant text := 'e1000000-0000-4000-8000-000000000005';
  e_mehmet constant text := 'e1000000-0000-4000-8000-000000000006';
begin
  perform pg_temp.seed_report(jonas, 'b1000000-0000-4000-8000-000000000001', 8,
    array['Alten Waschtisch demontiert', 'Neuen Waschtisch montiert', 'Ablaufgarnitur ausgetauscht', 'Dichtheitsprüfung durchgeführt'],
    '[{"description":"Waschtisch 60 cm, weiß","quantity":1,"unit":"Stk","manufacturer":"Villeroy & Boch"},
      {"description":"Einhebelmischer","quantity":1,"unit":"Stk","manufacturer":"Hansgrohe","article_number":"71100000"},
      {"description":"Ablaufgarnitur","quantity":1,"unit":"Stk"},
      {"description":"Eckventil 1/2\"","quantity":2,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 150),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 120)),
    true, 'approve');

  perform pg_temp.seed_report(lukas, 'b1000000-0000-4000-8000-000000000002', 9,
    array['Brenner gereinigt', 'Abgasmessung durchgeführt', 'Zündelektrode erneuert', 'Anlagendruck geprüft und aufgefüllt'],
    '[{"description":"Zündelektrode","quantity":1,"unit":"Stk","manufacturer":"Viessmann","article_number":"7838114"},
      {"description":"Dichtungssatz Brenner","quantity":1,"unit":"Satz"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 105)),
    true, 'approve');

  perform pg_temp.seed_report(tobias, 'b1000000-0000-4000-8000-000000000004', 6,
    array['Ölkessel demontiert und entsorgt', 'Öltank gereinigt (Fachfirma koordiniert)', 'Fundament für Außeneinheit vorbereitet'],
    '[{"description":"Entsorgung Altkessel","quantity":1,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 480),
                      jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 480),
                      jsonb_build_object('employee_id', e_mehmet, 'duration_minutes', 420)),
    true, 'approve');

  perform pg_temp.seed_report(tobias, 'b1000000-0000-4000-8000-000000000004', 3,
    array['Außeneinheit gesetzt', 'Hydraulische Anbindung Pufferspeicher', 'Kondensatleitung verlegt'],
    '[{"description":"Pufferspeicher 300 l","quantity":1,"unit":"Stk","manufacturer":"Weishaupt"},
      {"description":"Kupferrohr 22 mm","quantity":18,"unit":"m"},
      {"description":"Isolierung 22 mm","quantity":18,"unit":"m"},
      {"description":"Pressfitting Bogen 90° 22 mm","quantity":14,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 510),
                      jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 510)),
    true);

  perform pg_temp.seed_report(jonas, 'b1000000-0000-4000-8000-000000000005', 4,
    array['Fliesen im Duschbereich entfernt', 'Wasserleitungen zurückgebaut', 'Neue Vorwandinstallation gesetzt'],
    '[{"description":"Vorwandelement WC","quantity":1,"unit":"Stk","manufacturer":"Geberit","article_number":"111.300.00.5"},
      {"description":"Mehrschichtverbundrohr 16 mm","quantity":25,"unit":"m"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 450),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 450)),
    true, 'request_correction', 'Bitte verbautes Material vollständig angeben (Fittings fehlen).');

  perform pg_temp.seed_report(lukas, 'b1000000-0000-4000-8000-000000000006', 6,
    array['Störung Brenner analysiert', 'Ionisationselektrode getauscht', 'Probelauf, Warmwasser wieder verfügbar'],
    '[{"description":"Ionisationselektrode","quantity":1,"unit":"Stk"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_lukas, 'duration_minutes', 90)),
    true);

  perform pg_temp.seed_report(tobias, 'b1000000-0000-4000-8000-000000000009', 5,
    array['Filter Zu- und Abluft gewechselt', 'Volumenströme geprüft'],
    '[{"description":"Filterset G4/F7","quantity":1,"unit":"Satz"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_tobias, 'duration_minutes', 75)),
    true, 'approve');

  perform pg_temp.seed_report(jonas, 'b1000000-0000-4000-8000-000000000003', 1,
    array['Bodenablauf mit Spirale gereinigt', 'Geruchsverschluss demontiert und gereinigt'],
    '[]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 120)),
    true);

  perform pg_temp.seed_report(jonas, 'b1000000-0000-4000-8000-000000000005', 1,
    array['Abdichtung Duschbereich vorbereitet'],
    '[{"description":"Dichtband","quantity":1,"unit":"Rolle"}]',
    jsonb_build_array(jsonb_build_object('employee_id', e_jonas, 'duration_minutes', 300),
                      jsonb_build_object('employee_id', e_lena, 'duration_minutes', 300)),
    false);
end;
$$;

-- Weitere Zeiten (Fahrt, Lager, Pausen) – direkt erfasst
insert into public.time_entries (employee_id, entry_date, entry_type, job_id, duration_minutes, billable, note, created_by)
values
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(8), 'fahrzeit', 'b1000000-0000-4000-8000-000000000001', 25, true, 'Anfahrt Langenau', 'a1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(8), 'lager', null, 60, false, 'Material kommissioniert', 'a1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(8), 'pause', null, 30, false, null, 'a1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000004', pg_temp.wd(9), 'fahrzeit', 'b1000000-0000-4000-8000-000000000002', 35, true, null, 'a1000000-0000-4000-8000-000000000004'),
  ('e1000000-0000-4000-8000-000000000004', pg_temp.wd(9), 'materialbeschaffung', null, 45, false, 'Großhandel Ulm', 'a1000000-0000-4000-8000-000000000004'),
  ('e1000000-0000-4000-8000-000000000002', pg_temp.wd(3), 'pause', null, 30, false, null, 'a1000000-0000-4000-8000-000000000005'),
  ('e1000000-0000-4000-8000-000000000004', pg_temp.wd(3), 'pause', null, 30, false, null, 'a1000000-0000-4000-8000-000000000004'),
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(1), 'intern', null, 60, false, 'Fahrzeugpflege', 'a1000000-0000-4000-8000-000000000003');

insert into public.time_entries (employee_id, entry_date, entry_type, started_at, ended_at, break_minutes, duration_minutes, note, created_by)
values
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(1), 'lager',
   (pg_temp.wd(1) + time '13:00') at time zone 'Europe/Berlin',
   (pg_temp.wd(1) + time '14:30') at time zone 'Europe/Berlin', 0, 90, 'Lager aufgeräumt', 'a1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000003', pg_temp.wd(1), 'intern',
   (pg_temp.wd(1) + time '14:00') at time zone 'Europe/Berlin',
   (pg_temp.wd(1) + time '15:00') at time zone 'Europe/Berlin', 0, 60, 'Werkzeugprüfung', 'a1000000-0000-4000-8000-000000000003');

insert into public.employee_absences (employee_id, absence_type, start_date, end_date, half_day, note) values
  ('e1000000-0000-4000-8000-000000000005', 'berufsschule', pg_temp.wd(2), pg_temp.wd(2), false, 'Blockunterricht'),
  ('e1000000-0000-4000-8000-000000000006', 'krank', pg_temp.wd(2), pg_temp.wd(1), false, null),
  ('e1000000-0000-4000-8000-000000000004', 'urlaub', public.berlin_today() + 7, public.berlin_today() + 11, false, 'Genehmigt');

-- Abrechnungsstatus nach Erfassung der Berichte setzen
update public.jobs set status = 'abrechnungsbereit'
where id in ('b1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000009');
