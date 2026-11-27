-- Nur lesen: Ist das SQL-Update „Arbeitstag automatisch“ eingespielt, und wie viele Tage mit Stunden haben noch keinen Arbeitstag?
select
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'arbeitstage' and column_name = 'automatisch') as spalte_vorhanden,
  exists (select 1 from pg_trigger where tgname = 'zeiteintraege_arbeitstag') as automatik_aktiv,
  (select count(*) from (select employee_id, entry_date from public.zeiteintraege where entry_type <> 'pause' group by 1, 2) t
     left join public.arbeitstage a on a.employee_id = t.employee_id and a.work_date = t.entry_date
    where a.id is null) as tage_mit_stunden_ohne_arbeitstag,
  (select count(*) from public.arbeitstage a where to_jsonb(a) ->> 'automatisch' = 'true') as automatische_arbeitstage;
