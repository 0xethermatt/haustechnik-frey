import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

const insertDoc = (userId: string, jobId: string, art = 'angebot') => {
  const id = randomUUID()
  return db.query(
    `insert into public.auftragsdokumente (id, job_id, storage_path, filename, mime_type, art, size_bytes, created_by) values ($1, $2, $3, 'Angebot.pdf', 'application/pdf', $4, 1234, $5)`,
    [id, jobId, `${jobId}/${id}.pdf`, art, userId],
  )
}
const count = async () => (await db.query<{ n: number }>('select count(*)::int as n from public.auftragsdokumente')).rows[0].n

describe('Auftragsdokumente', () => {
  it('zugewiesener Mitarbeiter lädt Dokumente zum eigenen Auftrag hoch und sieht sie', async () => {
    await db.as(ids.geselleUser)
    await insertDoc(ids.geselleUser, ids.jobA)
    expect(await count()).toBe(1)
  })

  it('ohne Zuweisung weder sichtbar noch anlegbar; nicht im Namen anderer', async () => {
    await db.as(ids.otherUser)
    expect(await count()).toBe(0)
    await expect(insertDoc(ids.otherUser, ids.jobA)).rejects.toThrow(/row-level security/)
    await db.as(ids.geselleUser)
    await expect(insertDoc(ids.office, ids.jobA)).rejects.toThrow(/row-level security/)
  })

  it('Büro sieht alles; ohne Anmeldung nichts; löschen nur Ersteller oder Büro', async () => {
    await db.asAdmin()
    await db.query(`insert into public.auftragszuweisungen (job_id, employee_id) values ($1, $2)`, [ids.jobA, ids.other])
    await db.as(ids.otherUser)
    expect(await count()).toBe(1)
    expect((await db.query('delete from public.auftragsdokumente')).affectedRows).toBe(0)
    await db.as(null)
    await expect(db.query('select * from public.auftragsdokumente')).rejects.toThrow(/permission denied/)
    await db.as(ids.office)
    expect((await db.query('delete from public.auftragsdokumente')).affectedRows).toBe(1)
  })

  it('Auftrag löschen entfernt Dokumente und liefert die Dateipfade; Mitarbeiter darf mit Dokument nicht löschen', async () => {
    const id = randomUUID()
    await db.as(ids.geselleUser)
    await db.query(`insert into public.auftraege (id, customer_id, title, category, created_by) values ($1, $2, 'Fehleintrag', 'sonstiges', $3)`, [id, ids.customerA, ids.geselleUser])
    await insertDoc(ids.geselleUser, id)
    expect((await db.query<{ r: Record<string, unknown> }>('select public.auftrag_loeschvorschau($1) as r', [id])).rows[0].r).toMatchObject({ allowed: false, reason: 'HAS_CONTENT', documents: 1 })
    await expect(db.query('select public.auftrag_loeschen($1)', [id])).rejects.toThrow(/FORBIDDEN/)
    await db.as(ids.office)
    const res = (await db.query<{ r: { document_paths: string[] } }>('select public.auftrag_loeschen($1) as r', [id])).rows[0].r
    expect(res.document_paths).toHaveLength(1)
    await db.asAdmin()
    expect((await db.query<{ n: number }>('select count(*)::int as n from public.auftragsdokumente where job_id = $1', [id])).rows[0].n).toBe(0)
  })
})
