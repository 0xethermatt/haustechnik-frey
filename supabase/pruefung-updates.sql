-- Nur lesen: Welche SQL-Updates sind in dieser Datenbank eingespielt?
-- „true“ heißt eingespielt, „false“ heißt: das passende Update aus supabase/updates/ fehlt noch.
select
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'arbeitstage' and column_name = 'berufsschule') as update_1a_berufsschule,
  to_regclass('public.auftragsfotos') is not null as update_1b_fotos_tabelle,
  coalesce((select exists (select 1 from storage.buckets where id = 'auftragsfotos')), false) as update_1c_foto_speicher,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'arbeitstage' and column_name = 'automatisch') as update_2_arbeitstag_automatisch,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'auftrag_loeschen') as update_3_auftrag_loeschen,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'arbeitsbericht_loeschen') as update_4_bericht_loeschen;
