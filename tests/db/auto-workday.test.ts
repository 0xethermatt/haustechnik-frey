import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db
const DATE = '2026-11-24'

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

async function save(reportId: string, participants: { employee_id: string; duration_minutes: number }[], expectedVersion: number | null = null) {
  const res = await db.query<{ r: { version: number } }>('select public.arbeitsbericht_speichern($1::jsonb) as r', [
    JSON.stringify({
      id: reportId,
      mutation_id: randomUUID(),
      expected_version: expectedVersion,
      job_id: ids.jobA,
      report_date: DATE,
      activities: [{ id: randomUUID(), description: 'Montage' }],
      materials: [],
      participants,
      submit: false,
    }),
  ])
  return res.rows[0].r.version
}

async function day(employeeId: string) {
  await db.asAdmin()
  const r = await db.query<{ start_time: string; end_time: string; duration_minutes: number; automatisch: boolean }>(
    'select start_time::text, end_time::text, duration_minutes, automatisch from public.arbeitstage where employee_id = $1 and work_date = $2',
    [employeeId, DATE],
  )
  return r.rows[0]
}

describe('Arbeitstag automatisch aus Berichtsstunden', () => {
  const reportId = randomUUID()
  let version = 0

  it('gemeinsamer Bericht legt für jeden Beteiligten einen Arbeitstag an', async () => {
    await db.as(ids.geselleUser)
    version = await save(reportId, [
      { employee_id: ids.geselle, duration_minutes: 510 },
      { employee_id: ids.azubi, duration_minutes: 240 },
    ])
    expect(await day(ids.geselle)).toEqual({ start_time: '07:30:00', end_time: '16:00:00', duration_minutes: 510, automatisch: true })
    expect(await day(ids.azubi)).toEqual({ start_time: '07:30:00', end_time: '11:30:00', duration_minutes: 240, automatisch: true })
  })

  it('Änderung der Stunden zieht den automatischen Arbeitstag nach, Austragen entfernt ihn', async () => {
    await db.as(ids.geselleUser)
    version = await save(reportId, [{ employee_id: ids.geselle, duration_minutes: 360 }], version)
    expect((await day(ids.geselle)).end_time).toBe('13:30:00')
    expect(await day(ids.azubi)).toBeUndefined()
  })

  it('von Hand erfasster Arbeitstag wird nie überschrieben', async () => {
    await db.as(ids.geselleUser)
    await db.query(`update public.arbeitstage set end_time = '17:00' where employee_id = $1 and work_date = $2`, [ids.geselle, DATE])
    expect((await day(ids.geselle)).automatisch).toBe(false)
    await db.as(ids.geselleUser)
    version = await save(reportId, [{ employee_id: ids.geselle, duration_minutes: 120 }], version)
    expect(await day(ids.geselle)).toMatchObject({ end_time: '17:00:00', duration_minutes: 570, automatisch: false })
  })

  it('weitere Zeiten (z. B. Lager) verlängern einen automatischen Tag', async () => {
    await db.asAdmin()
    await db.query(`insert into public.zeiteintraege (employee_id, entry_date, entry_type, duration_minutes, billable) values ($1, $2, 'lager', 60, false)`, [ids.other, DATE])
    await db.query(`insert into public.zeiteintraege (employee_id, entry_date, entry_type, duration_minutes, billable) values ($1, $2, 'intern', 30, false)`, [ids.other, DATE])
    expect(await day(ids.other)).toMatchObject({ end_time: '09:00:00', duration_minutes: 90, automatisch: true })
    await db.query(`insert into public.zeiteintraege (employee_id, entry_date, entry_type, duration_minutes, billable) values ($1, $2, 'pause', 30, false)`, [ids.other, DATE])
    expect((await day(ids.other)).duration_minutes).toBe(90)
    await db.query(`delete from public.zeiteintraege where employee_id = $1 and entry_date = $2`, [ids.other, DATE])
    expect(await day(ids.other)).toBeUndefined()
  })

  it('Entwurf verwerfen entfernt den automatischen Arbeitstag', async () => {
    const draft = randomUUID()
    await db.as(ids.geselleUser)
    const v = await save(draft, [{ employee_id: ids.azubi, duration_minutes: 90 }])
    expect(await day(ids.azubi)).toMatchObject({ duration_minutes: 90, automatisch: true })
    await db.as(ids.geselleUser)
    await db.query('select public.arbeitsbericht_entwurf_loeschen($1, $2)', [draft, v])
    expect(await day(ids.azubi)).toBeUndefined()
  })
})

describe('Ohne Erfassungspflicht (Inhaber schreibt auf Papier)', () => {
  const D = '2026-11-20'
  async function reportWith(employeeId: string, minutes: number) {
    const id = randomUUID()
    await db.as(ids.geselleUser)
    await db.query('select public.arbeitsbericht_speichern($1::jsonb)', [
      JSON.stringify({
        id, mutation_id: randomUUID(), expected_version: null, job_id: ids.jobA, report_date: D,
        activities: [{ id: randomUUID(), description: 'Montage' }], materials: [],
        participants: [{ employee_id: ids.geselle, duration_minutes: 480 }, { employee_id: employeeId, duration_minutes: minutes }], submit: false,
      }),
    ])
  }
  const dayOf = async (employeeId: string) => {
    await db.asAdmin()
    return (await db.query<{ duration_minutes: number }>('select duration_minutes from public.arbeitstage where employee_id = $1 and work_date = $2', [employeeId, D])).rows[0]
  }

  it('kein automatischer Arbeitstag, Stunden stehen trotzdem im Bericht', async () => {
    await db.asAdmin()
    await db.query('update public.mitarbeiter set requires_time_tracking = false where id = $1', [ids.other])
    await reportWith(ids.other, 120)
    expect(await dayOf(ids.geselle)).toMatchObject({ duration_minutes: 480 })
    expect(await dayOf(ids.other)).toBeUndefined()
    const entries = await db.query<{ n: number }>('select count(*)::int as n from public.zeiteintraege where employee_id = $1 and entry_date = $2', [ids.other, D])
    expect(entries.rows[0].n).toBe(1)
  })

  it('Umschalten zieht automatische Arbeitstage nach bzw. entfernt sie', async () => {
    await db.asAdmin()
    await db.query('update public.mitarbeiter set requires_time_tracking = true where id = $1', [ids.other])
    expect(await dayOf(ids.other)).toMatchObject({ duration_minutes: 120 })
    await db.asAdmin()
    await db.query('update public.mitarbeiter set requires_time_tracking = false where id = $1', [ids.other])
    expect(await dayOf(ids.other)).toBeUndefined()
  })
})
