import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

const insertPhoto = (userId: string, jobId: string, phase = 'rohinstallation') => {
  const id = randomUUID()
  return db.query(
    `insert into public.auftragsfotos (id, job_id, storage_path, thumb_path, phase, created_by)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, jobId, `${jobId}/${id}.jpg`, `${jobId}/${id}_t.jpg`, phase, userId],
  )
}
const count = async () => (await db.query<{ n: number }>('select count(*)::int as n from public.auftragsfotos')).rows[0].n

describe('Auftragsfotos', () => {
  it('zugewiesener Mitarbeiter kann Fotos zu seinem Auftrag hinzufügen und sehen', async () => {
    await db.as(ids.geselleUser)
    await insertPhoto(ids.geselleUser, ids.jobA)
    expect(await count()).toBe(1)
  })

  it('Mitarbeiter ohne Zuweisung sieht Fotos fremder Aufträge nicht und kann dort nichts anlegen', async () => {
    await db.as(ids.otherUser)
    expect(await count()).toBe(0)
    await expect(insertPhoto(ids.otherUser, ids.jobA)).rejects.toThrow(/row-level security/)
  })

  it('niemand kann Fotos im Namen eines anderen anlegen', async () => {
    await db.as(ids.geselleUser)
    await expect(insertPhoto(ids.office, ids.jobA)).rejects.toThrow(/row-level security/)
  })

  it('Büro sieht alle Fotos und kann sie löschen; ohne Anmeldung ist nichts sichtbar', async () => {
    await db.as(ids.office)
    expect(await count()).toBe(1)
    await db.as(null)
    await expect(db.query('select * from public.auftragsfotos')).rejects.toThrow(/permission denied/)
  })

  it('nur Ersteller oder Büro dürfen löschen', async () => {
    await db.as(ids.geselleUser)
    await insertPhoto(ids.geselleUser, ids.jobA, 'fertigmontage')
    // zweiter Mitarbeiter wird dem Auftrag zugewiesen, darf sehen, aber nicht löschen
    await db.asAdmin()
    await db.query(`insert into public.auftragszuweisungen (job_id, employee_id) values ($1, $2)`, [ids.jobA, ids.other])
    await db.as(ids.otherUser)
    expect(await count()).toBe(2)
    const del = await db.query('delete from public.auftragsfotos')
    expect(del.affectedRows).toBe(0)
    await db.as(ids.office)
    expect((await db.query('delete from public.auftragsfotos where phase = $1', ['fertigmontage'])).affectedRows).toBe(1)
  })

  it('Dateipfad liefert die Auftrags-ID, fremde Pfade nicht', async () => {
    await db.asAdmin()
    const r = await db.query<{ a: string | null; b: string | null }>(
      `select public.foto_auftrag_id('${ids.jobA}/x.jpg')::text as a, public.foto_auftrag_id('anderer-pfad/x.jpg')::text as b`,
    )
    expect(r.rows[0]).toEqual({ a: ids.jobA, b: null })
  })
})
