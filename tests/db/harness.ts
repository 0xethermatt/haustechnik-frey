import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

/** Minimale Nachbildung der Supabase-Umgebung (Rollen, auth-Schema, Standardrechte). */
const SUPABASE_SHIM = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}',
  raw_app_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`

export type Db = PGlite & {
  as(userId: string | null): Promise<void>
  asAdmin(): Promise<void>
}

export async function createTestDb(): Promise<Db> {
  const db = (await PGlite.create({ extensions: { pg_trgm } })) as unknown as Db
  await db.exec(SUPABASE_SHIM)
  const dir = path.resolve(__dirname, '../../supabase/migrations')
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(path.join(dir, file), 'utf8'))
  }
  db.as = async (userId) => {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ''])
    await db.exec(userId ? 'set role authenticated' : 'set role anon')
  }
  db.asAdmin = async () => {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`)
  }
  return db
}

export const ids = {
  admin: 'a0000000-0000-4000-8000-000000000001',
  office: 'a0000000-0000-4000-8000-000000000002',
  geselleUser: 'a0000000-0000-4000-8000-000000000003',
  otherUser: 'a0000000-0000-4000-8000-000000000004',
  noRoleUser: 'a0000000-0000-4000-8000-000000000005',
  geselle: 'e0000000-0000-4000-8000-000000000001',
  azubi: 'e0000000-0000-4000-8000-000000000002',
  other: 'e0000000-0000-4000-8000-000000000003',
  customerA: 'c0000000-0000-4000-8000-000000000001',
  customerB: 'c0000000-0000-4000-8000-000000000002',
  jobA: 'b0000000-0000-4000-8000-000000000001',
  jobB: 'b0000000-0000-4000-8000-000000000002',
}

/** Grunddaten: Admin, Büro, zwei Monteure mit Konto, ein Azubi ohne Konto, zwei Kunden/Aufträge. */
export async function seedBase(db: Db) {
  await db.asAdmin()
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ids.admin}', 'admin@frey.test'), ('${ids.office}', 'buero@frey.test'),
      ('${ids.geselleUser}', 'jonas@frey.test'), ('${ids.otherUser}', 'lukas@frey.test'),
      ('${ids.noRoleUser}', 'neu@frey.test');
    update public.profiles set roles = '{admin}' where id = '${ids.admin}';
    update public.profiles set roles = '{office}' where id = '${ids.office}';
    update public.profiles set roles = '{employee}' where id in ('${ids.geselleUser}', '${ids.otherUser}');
    insert into public.employees (id, profile_id, employee_number, first_name, last_name, employment_role, start_date) values
      ('${ids.geselle}', '${ids.geselleUser}', '103', 'Jonas', 'Keller', 'geselle', '2020-09-01'),
      ('${ids.azubi}', null, '201', 'Lena', 'Schmid', 'auszubildender', '2024-09-01'),
      ('${ids.other}', '${ids.otherUser}', '104', 'Lukas', 'Brenner', 'geselle', '2019-03-01');
    insert into public.customers (id, first_name, last_name, billing_street, billing_postal_code, billing_city, phone, email) values
      ('${ids.customerA}', 'Hans', 'Müller', 'Lindenweg 4', '89129', 'Langenau', '07345 12345', 'hans.mueller@example.de'),
      ('${ids.customerB}', 'Petra', 'Wagner', 'Hauptstraße 12', '89073', 'Ulm', '0731 998877', null);
    insert into public.jobs (id, customer_id, title, category, start_date) values
      ('${ids.jobA}', '${ids.customerA}', 'Waschtisch erneuern', 'sanitaer', '2026-11-01'),
      ('${ids.jobB}', '${ids.customerB}', 'Heizungswartung', 'wartung', '2026-11-01');
    insert into public.job_assignments (job_id, employee_id) values
      ('${ids.jobA}', '${ids.geselle}'), ('${ids.jobB}', '${ids.other}');
  `)
}
