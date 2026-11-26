import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, seedBase, type Db } from './harness'

const sql = (f: string) => readFileSync(path.resolve(__dirname, '../../supabase', f), 'utf8')
let db: Db

async function count(table: string) {
  await db.asAdmin()
  const r = await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`)
  return r.rows[0].n
}

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

describe('Demo-Daten', () => {
  it('lassen sich einspielen und vollständig entfernen', async () => {
    const tables = ['kunden', 'mitarbeiter', 'auftraege', 'arbeitsberichte', 'zeiteintraege', 'arbeitstage', 'fehlzeiten', 'einsatzorte']
    const before = Object.fromEntries(await Promise.all(tables.map(async (t) => [t, await count(t)])))

    await db.asAdmin()
    await db.exec(sql('demo-daten.sql'))

    expect(await count('kunden')).toBe(before.kunden + 7)
    expect(await count('mitarbeiter')).toBe(before.mitarbeiter + 5)
    expect(await count('auftraege')).toBe(before.auftraege + 8)
    expect(await count('arbeitsberichte')).toBe(before.arbeitsberichte + 9)
    expect(await count('arbeitstage')).toBeGreaterThan(80)
    const status = await db.query<{ status: string; n: number }>(
      'select status::text, count(*)::int as n from public.arbeitsberichte group by 1 order by 1',
    )
    expect(Object.fromEntries(status.rows.map((r) => [r.status, r.n]))).toEqual({
      entwurf: 1, eingereicht: 3, freigegeben: 4, korrektur_erforderlich: 1,
    })

    await expect(db.exec(sql('demo-daten.sql'))).rejects.toThrow(/bereits vorhanden/)

    await db.asAdmin()
    await db.exec(sql('demo-daten-entfernen.sql'))
    for (const t of tables) expect(await count(t)).toBe(before[t])
  })
})
