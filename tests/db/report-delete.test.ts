import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

async function submitted(date: string, submit = true) {
  const id = randomUUID()
  await db.as(ids.geselleUser)
  await db.query('select public.arbeitsbericht_speichern($1::jsonb)', [
    JSON.stringify({
      id, mutation_id: randomUUID(), expected_version: null, job_id: ids.jobA, report_date: date,
      activities: [{ id: randomUUID(), description: 'Montage' }], materials: [{ id: randomUUID(), description: 'Rohr', quantity: 2, unit: 'm' }],
      participants: [{ employee_id: ids.geselle, duration_minutes: 300 }, { employee_id: ids.azubi, duration_minutes: 180 }], submit,
    }),
  ])
  return id
}
const remove = async (id: string) => (await db.query<{ r: Record<string, unknown> }>('select public.arbeitsbericht_loeschen($1) as r', [id])).rows[0].r
const n = async (sql: string, p: unknown[] = []) => (await db.query<{ n: number }>(sql, p)).rows[0].n

describe('Bericht löschen (Büro)', () => {
  it('Büro löscht einen eingereichten Bericht samt Zeiten, Material und automatischen Arbeitstagen', async () => {
    const id = await submitted('2026-11-23')
    await db.as(ids.office)
    expect(await remove(id)).toMatchObject({ status: 'eingereicht', time_entries: 2, people: 2, minutes: 480 })
    await db.asAdmin()
    expect(await n('select count(*)::int as n from public.arbeitsberichte where id = $1', [id])).toBe(0)
    expect(await n('select count(*)::int as n from public.arbeitsbericht_material')).toBe(0)
    expect(await n(`select count(*)::int as n from public.zeiteintraege where entry_date = '2026-11-23'`)).toBe(0)
    expect(await n(`select count(*)::int as n from public.arbeitstage where work_date = '2026-11-23'`)).toBe(0)
    expect(await n(`select count(*)::int as n from public.aenderungsprotokoll where table_name = 'arbeitsberichte' and action = 'DELETE' and reason = 'Bericht gelöscht'`)).toBe(1)
  })

  it('auch freigegebene Berichte lassen sich löschen', async () => {
    const id = await submitted('2026-11-24')
    await db.asAdmin()
    const version = (await db.query<{ version: number }>('select version from public.arbeitsberichte where id = $1', [id])).rows[0].version
    await db.as(ids.office)
    await db.query(`select public.arbeitsbericht_pruefen($1, $2, 'approve', null)`, [id, version])
    expect(await remove(id)).toMatchObject({ status: 'freigegeben' })
  })

  it('Mitarbeiter dürfen eingereichte Berichte nicht löschen', async () => {
    const id = await submitted('2026-11-25')
    await db.as(ids.geselleUser)
    await expect(remove(id)).rejects.toThrow(/FORBIDDEN/)
    await db.as(ids.otherUser)
    await expect(remove(id)).rejects.toThrow(/FORBIDDEN/)
  })

  it('Berichte abgerechneter Aufträge sind gesperrt', async () => {
    const id = await submitted('2026-11-26')
    await db.asAdmin()
    await db.query(`update public.auftraege set status = 'abgerechnet' where id = $1`, [ids.jobA])
    await db.as(ids.office)
    await expect(remove(id)).rejects.toThrow(/LOCKED/)
    await expect(remove(randomUUID())).rejects.toThrow(/NOT_FOUND/)
  })
})
