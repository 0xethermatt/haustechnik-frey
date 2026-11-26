-- Nur lesen (select) – ändert nichts. Im Supabase SQL Editor jeweils EINE Abfrage markieren und „Run“ klicken.

-- ① Tagesübersicht der letzten 10 Tage: wer hat wann gearbeitet und was wurde berichtet?
with tage as (
  select generate_series(public.berlin_heute() - 9, public.berlin_heute(), interval '1 day')::date as tag
),
berichte as (
  select z.employee_id, z.entry_date as tag,
         sum(z.duration_minutes) as berichts_minuten,
         string_agg(distinct coalesce(k.company_name, concat_ws(' ', k.first_name, k.last_name)) || ' (' || b.status::text || ')', ', ') as berichte
  from public.zeiteintraege z
  join public.arbeitsbericht_zeiteintraege l on l.time_entry_id = z.id
  join public.arbeitsberichte b on b.id = l.work_report_id
  join public.auftraege j on j.id = b.job_id
  join public.kunden k on k.id = j.customer_id
  group by z.employee_id, z.entry_date
)
select to_char(t.tag, 'DY DD.MM.') as tag,
       m.first_name || ' ' || m.last_name as mitarbeiter,
       coalesce(to_char(a.start_time, 'HH24:MI') || '–' || to_char(a.end_time, 'HH24:MI'), '—') as arbeitszeit,
       coalesce(round(extract(epoch from (a.end_time - a.start_time)) / 60 - a.break_minutes)::int, 0) as minuten_anwesend,
       coalesce(br.berichts_minuten, 0) as minuten_in_berichten,
       coalesce(br.berichte, '— kein Bericht —') as berichte,
       coalesce(f.absence_type::text, '') as fehlzeit
from tage t
cross join public.mitarbeiter m
left join public.arbeitstage a on a.employee_id = m.id and a.work_date = t.tag
left join berichte br on br.employee_id = m.id and br.tag = t.tag
left join public.fehlzeiten f on f.employee_id = m.id and t.tag between f.start_date and f.end_date
where m.is_active and extract(isodow from t.tag) < 6 and t.tag >= m.start_date
order by t.tag desc, m.last_name;

-- ② Kunden und Aufträge, die zuletzt angelegt wurden (inkl. fehlender Adresse)
select 'Kunde' as art, k.customer_number::text as nr,
       coalesce(k.company_name, concat_ws(' ', k.first_name, k.last_name)) as name,
       concat_ws(', ', k.billing_street, concat_ws(' ', k.billing_postal_code, k.billing_city)) as adresse,
       to_char(k.created_at at time zone 'Europe/Berlin', 'DD.MM. HH24:MI') as angelegt
from public.kunden k
where k.id::text not like 'c9000000-%'
union all
select 'Auftrag', 'B-' || j.job_number, j.title || ' (' || j.status::text || ')', '', to_char(j.created_at at time zone 'Europe/Berlin', 'DD.MM. HH24:MI')
from public.auftraege j
where j.id::text not like 'b9000000-%'
order by 5 desc;
