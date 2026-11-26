-- Update 26.11.2026: Berufsschule (Arbeitstage) + Auftragsfotos.
-- Beliebig oft ausführbar (fehlendes wird ergänzt, Vorhandenes bleibt unverändert).
-- Im Supabase SQL Editor komplett einfügen und „Run“ klicken. Erwartet: „Success. No rows returned“.

-- 1) Berufsschultag: Azubis tragen die Schule pauschal als Arbeitstag ein (zählt als Arbeitszeit).
alter table public.arbeitstage add column if not exists berufsschule boolean not null default false;

-- 2) Fotos zu Aufträgen: Metadaten in der Tabelle, Bilddateien im privaten Storage-Bucket „auftragsfotos“.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fotophase' and typnamespace = 'public'::regnamespace) then
    create type public.fotophase as enum (
      'bestand', 'rohinstallation', 'heizungsanlage', 'fertigmontage', 'inbetriebnahme', 'sonstiges'
    );
  end if;
end;
$$;

create table if not exists public.auftragsfotos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.auftraege (id) on delete restrict,
  storage_path text not null unique,
  thumb_path text not null unique,
  phase public.fotophase not null default 'sonstiges',
  caption text check (caption is null or length(caption) <= 300),
  taken_on date not null default (now() at time zone 'Europe/Berlin')::date,
  size_bytes integer check (size_bytes is null or size_bytes > 0),
  created_by uuid references public.benutzerprofile (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists auftragsfotos_job_idx on public.auftragsfotos (job_id, created_at desc);

drop trigger if exists auftragsfotos_audit on public.auftragsfotos;
create trigger auftragsfotos_audit after insert or update or delete on public.auftragsfotos
  for each row execute function public.aenderung_protokollieren();

alter table public.auftragsfotos enable row level security;
revoke all on public.auftragsfotos from anon;

drop policy if exists auftragsfotos_select on public.auftragsfotos;
drop policy if exists auftragsfotos_insert on public.auftragsfotos;
drop policy if exists auftragsfotos_update on public.auftragsfotos;
drop policy if exists auftragsfotos_delete on public.auftragsfotos;

create policy auftragsfotos_select on public.auftragsfotos for select to authenticated
  using (public.darf_auftrag_sehen(job_id));
create policy auftragsfotos_insert on public.auftragsfotos for insert to authenticated
  with check (public.darf_auftrag_sehen(job_id) and created_by = auth.uid());
create policy auftragsfotos_update on public.auftragsfotos for update to authenticated
  using (public.ist_buero() or created_by = auth.uid())
  with check (public.ist_buero() or created_by = auth.uid());
create policy auftragsfotos_delete on public.auftragsfotos for delete to authenticated
  using (public.ist_buero() or created_by = auth.uid());

-- Auftrags-ID aus dem Dateipfad („<uuid>/…“); null bei fremden Pfaden.
create or replace function public.foto_auftrag_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then split_part(p_name, '/', 1)::uuid
  end
$$;

grant execute on function public.foto_auftrag_id(text) to authenticated;

-- 3) Storage-Bucket und Zugriffsregeln (nur wo das Storage-Schema existiert)
do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('auftragsfotos', 'auftragsfotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;

  drop policy if exists auftragsfotos_objekte_lesen on storage.objects;
  drop policy if exists auftragsfotos_objekte_anlegen on storage.objects;
  drop policy if exists auftragsfotos_objekte_loeschen on storage.objects;

  create policy auftragsfotos_objekte_lesen on storage.objects for select to authenticated
    using (bucket_id = 'auftragsfotos' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsfotos_objekte_anlegen on storage.objects for insert to authenticated
    with check (bucket_id = 'auftragsfotos' and public.darf_auftrag_sehen(public.foto_auftrag_id(name)));
  create policy auftragsfotos_objekte_loeschen on storage.objects for delete to authenticated
    using (bucket_id = 'auftragsfotos' and (public.ist_buero() or owner_id = auth.uid()::text));
end;
$$;
