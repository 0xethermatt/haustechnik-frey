import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

const preview = async (jobId: string) => (await db.query<{ r: Record<string, unknown> }>('select public.auftrag_loeschvorschau($1) as r', [jobId])).rows[0].r
const remove = async (jobId: string) => (await db.query<{ r: { photo_paths: string[] } }>('select public.auftrag_loeschen($1) as r', [jobId])).rows[0].r
const count = async (table: string, where = 'true', params: unknown[] = []) =>
  (await db.query<{ n: number }>(`select count(*)::int as n from public.${table} where ${where}`, params)).rows[0].n

async function newJob(userId: string, title = 'Fehleintrag') {
  const id = randomUUID()
  await db.as(userId)
  await db.query(`insert into public.auftraege (id, customer_id, title, category, created_by) values ($1, $2, $3, 'sonstiges', $4)`, [id, ids.customerA, title, userId])
  return id
}

describe('Auftrag komplett löschen', () => {
  it('Mitarbeiter löscht einen selbst angelegten, leeren Auftrag', async () => {
    const id = await newJob(ids.geselleUser)
    expect(await preview(id)).toMatchObject({ allowed: true, reports: 0, time_entries: 0, photos: 0 })
    await db.as(ids.geselleUser)
    await remove(id)
    await db.asAdmin()
    expect(await count('auftraege', 'id = $1', [id])).toBe(0)
  })

  it('Mitarbeiter darf keinen Auftrag mit Inhalt oder fremde Aufträge löschen', async () => {
    const id = await newJob(ids.geselleUser)
    await db.query(`insert into public.auftragsfotos (job_id, storage_path, thumb_path, created_by) values ($1, $2, $3, $4)`, [id, `${id}/a.jpg`, `${id}/a_t.jpg`, ids.geselleUser])
    await db.as(ids.geselleUser)
    expect(await preview(id)).toMatchObject({ allowed: false, reason: 'HAS_CONTENT', photos: 1 })
    await expect(remove(id)).rejects.toThrow(/FORBIDDEN/)
    // fremder Auftrag (jobA wurde ohne created_by angelegt, Jonas ist nur zugewiesen)
    expect(await preview(ids.jobA)).toMatchObject({ allowed: false, reason: 'FORBIDDEN' })
    await expect(remove(ids.jobA)).rejects.toThrow(/FORBIDDEN/)
    await db.as(ids.otherUser)
    expect(await preview(id)).toMatchObject({ allowed: false, reason: 'NOT_FOUND' })
  })

  it('Büro löscht einen Auftrag mit Bericht, Zeiten und Fotos vollständig; Fotopfade kommen zurück', async () => {
    await db.as(ids.geselleUser)
    const reportId = randomUUID()
    await db.query('select public.arbeitsbericht_speichern($1::jsonb)', [
      JSON.stringify({
        id: reportId, mutation_id: randomUUID(), expected_version: null, job_id: ids.jobA, report_date: '2026-11-24',
        activities: [{ id: randomUUID(), description: 'Montage' }], materials: [],
        participants: [{ employee_id: ids.geselle, duration_minutes: 240 }, { employee_id: ids.azubi, duration_minutes: 120 }], submit: false,
      }),
    ])
    await db.query(`insert into public.auftragsfotos (job_id, storage_path, thumb_path, created_by) values ($1, 'pfad/x.jpg', 'pfad/x_t.jpg', $2)`, [ids.jobA, ids.geselleUser])
    await db.as(ids.office)
    expect(await preview(ids.jobA)).toMatchObject({ allowed: true, reports: 1, time_entries: 2, people: 2, photos: 1 })
    const res = await remove(ids.jobA)
    expect(res.photo_paths.sort()).toEqual(['pfad/x.jpg', 'pfad/x_t.jpg'])
    await db.asAdmin()
    expect(await count('auftraege', 'id = $1', [ids.jobA])).toBe(0)
    expect(await count('arbeitsberichte', 'job_id = $1', [ids.jobA])).toBe(0)
    expect(await count('zeiteintraege', 'job_id = $1', [ids.jobA])).toBe(0)
    expect(await count('arbeitsbericht_zeiteintraege')).toBe(0)
    expect(await count('auftragsfotos', 'job_id = $1', [ids.jobA])).toBe(0)
    // automatisch entstandene Arbeitstage verschwinden mit den Stunden
    expect(await count('arbeitstage', 'work_date = $1', ['2026-11-24'])).toBe(0)
    // Löschung ist protokolliert
    const audit = await db.query<{ n: number }>(`select count(*)::int as n from public.aenderungsprotokoll where table_name = 'auftraege' and action = 'DELETE' and reason = 'Auftrag gelöscht'`)
    expect(audit.rows[0].n).toBeGreaterThanOrEqual(2)
  })

  it('abgerechnete Aufträge sind gesperrt, auch fürs Büro', async () => {
    const id = await newJob(ids.office)
    await db.asAdmin()
    await db.query(`update public.auftraege set status = 'abgerechnet' where id = $1`, [id])
    await db.as(ids.office)
    expect(await preview(id)).toMatchObject({ allowed: false, reason: 'BILLED' })
    await expect(remove(id)).rejects.toThrow(/LOCKED/)
  })
})
