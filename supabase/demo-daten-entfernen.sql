-- Entfernt ALLE Demo-Daten aus supabase/demo-daten.sql wieder (erkennbar an IDs ...9000-...).
-- Echte Daten bleiben unberührt. Das Änderungsprotokoll behält seine Einträge (gewollt: unveränderlich).

delete from public.arbeitsbericht_zeiteintraege
where work_report_id in (select id from public.arbeitsberichte where job_id::text like 'b9000000-%');
delete from public.arbeitsberichte where job_id::text like 'b9000000-%';
delete from public.zeiteintraege
where employee_id::text like 'e9000000-%' or job_id::text like 'b9000000-%';
delete from public.arbeitstage where employee_id::text like 'e9000000-%';
delete from public.fehlzeiten where employee_id::text like 'e9000000-%';
delete from public.auftraege where id::text like 'b9000000-%';
delete from public.einsatzorte where customer_id::text like 'c9000000-%';
delete from public.kunden where id::text like 'c9000000-%';
delete from public.mitarbeiter where id::text like 'e9000000-%';
