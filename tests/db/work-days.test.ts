import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

const insert = (employeeId: string, date = '2026-11-24', start = '07:30', end = '16:00', brk = 30) =>
  db.query<{ duration_minutes: number }>(
    `insert into public.arbeitstage (employee_id, work_date, start_time, end_time, break_minutes)
     values ($1, $2, $3, $4, $5) returning duration_minutes`,
    [employeeId, date, start, end, brk],
  )

describe('Arbeitstage', () => {
  it('Mitarbeiter erfasst eigenen Tag; Dauer wird in Minuten berechnet', async () => {
    await db.as(ids.geselleUser)
    const res = await insert(ids.geselle)
    expect(res.rows[0].duration_minutes).toBe(480)
  })

  it('Berufsschultag ist standardmäßig aus und kann vom Mitarbeiter gesetzt werden', async () => {
    await db.as(ids.geselleUser)
    expect((await db.query<{ berufsschule: boolean }>('select berufsschule from public.arbeitstage where employee_id = $1', [ids.geselle])).rows[0].berufsschule).toBe(false)
    await db.query(
      `insert into public.arbeitstage (employee_id, work_date, start_time, end_time, break_minutes, berufsschule)
       values ($1, '2026-11-19', '08:00', '15:30', 0, true)`,
      [ids.geselle],
    )
    const r = await db.query<{ berufsschule: boolean; duration_minutes: number }>(
      `select berufsschule, duration_minutes from public.arbeitstage where employee_id = $1 and work_date = '2026-11-19'`,
      [ids.geselle],
    )
    expect(r.rows[0]).toEqual({ berufsschule: true, duration_minutes: 450 })
    await db.query(`delete from public.arbeitstage where employee_id = $1 and work_date = '2026-11-19'`, [ids.geselle])
  })

  it('nur ein Arbeitstag pro Mitarbeiter und Datum', async () => {
    await db.as(ids.geselleUser)
    await expect(insert(ids.geselle)).rejects.toThrow(/duplicate key/)
  })

  it('Pause länger als Arbeitszeit und Ende vor Beginn werden abgelehnt', async () => {
    await db.as(ids.geselleUser)
    await expect(insert(ids.geselle, '2026-11-23', '07:30', '08:00', 45)).rejects.toThrow(/arbeitstage_break_fits/)
    await expect(insert(ids.geselle, '2026-11-22', '16:00', '07:30', 0)).rejects.toThrow(/violates check constraint/)
  })

  it('Mitarbeiter kann keine Tage für Kollegen anlegen oder sehen', async () => {
    await db.as(ids.otherUser)
    await expect(insert(ids.geselle, '2026-11-20')).rejects.toThrow(/row-level security/)
    expect((await db.query('select * from public.arbeitstage where employee_id = $1', [ids.geselle])).rows).toHaveLength(0)
    expect(
      (await db.query(`update public.arbeitstage set end_time = '18:00' where employee_id = $1`, [ids.geselle])).affectedRows,
    ).toBe(0)
  })

  it('Büro sieht und pflegt alle Tage; Änderungen landen im Audit-Log', async () => {
    await db.as(ids.office)
    await insert(ids.azubi, '2026-11-24', '07:30', '13:30', 0)
    expect((await db.query('select * from public.arbeitstage')).rows.length).toBe(2)
    await db.query(`update public.arbeitstage set end_time = '16:30' where employee_id = $1`, [ids.geselle])
    await db.asAdmin()
    const audit = await db.query(`select 1 from public.aenderungsprotokoll where table_name = 'arbeitstage' and action = 'UPDATE'`)
    expect(audit.rows).toHaveLength(1)
  })

  it('Ortskürzel: lesbar für alle Mitglieder, änderbar nur durch das Büro', async () => {
    await db.as(ids.geselleUser)
    expect((await db.query('select * from public.ortskuerzel')).rows.length).toBeGreaterThan(0)
    await expect(db.query(`insert into public.ortskuerzel (city, abbreviation) values ('Elchingen', 'EL')`)).rejects.toThrow(
      /row-level security/,
    )
    await db.as(ids.office)
    await db.query(`insert into public.ortskuerzel (city, abbreviation) values ('Elchingen', 'EL')`)
    await db.as(null)
    await expect(db.query('select * from public.arbeitstage')).rejects.toThrow(/permission denied/)
  })
})
