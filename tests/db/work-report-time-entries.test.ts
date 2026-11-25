import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

interface Participant {
  employee_id: string
  duration_minutes?: number
  started_at?: string
  ended_at?: string
  break_minutes?: number
}

function payload(overrides: Record<string, unknown> & { id: string }) {
  return {
    mutation_id: randomUUID(),
    expected_version: null,
    job_id: ids.jobA,
    report_date: '2026-11-20',
    activities: [{ id: randomUUID(), description: 'Alten Waschtisch demontiert' }],
    materials: [{ id: randomUUID(), description: 'Waschtisch', quantity: 1, unit: 'Stk' }],
    participants: [] as Participant[],
    submit: false,
    ...overrides,
  }
}

async function save(p: Record<string, unknown>) {
  const res = await db.query<{ r: { id: string; version: number; status: string; replayed: boolean } }>(
    'select public.arbeitsbericht_speichern($1::jsonb) as r',
    [JSON.stringify(p)],
  )
  return res.rows[0].r
}

async function entriesFor(reportId: string) {
  await db.asAdmin()
  const res = await db.query<{ id: string; employee_id: string; duration_minutes: number; entry_date: string; job_id: string }>(
    `select t.id, t.employee_id, t.duration_minutes, t.entry_date::text, t.job_id
       from public.zeiteintraege t
       join public.arbeitsbericht_zeiteintraege l on l.time_entry_id = t.id
      where l.work_report_id = $1 order by t.employee_id`,
    [reportId],
  )
  return res.rows
}

async function totalEntryCount() {
  await db.asAdmin()
  const res = await db.query<{ n: number }>('select count(*)::int as n from public.zeiteintraege')
  return res.rows[0].n
}

describe('Arbeitsbericht ↔ Zeiteinträge (eine Quelle der Wahrheit)', () => {
  const reportId = randomUUID()
  let version = 0
  let originalEntryIds: string[] = []

  it('legt pro Teilnehmer genau einen Zeiteintrag an', async () => {
    await db.as(ids.geselleUser)
    const r = await save(
      payload({
        id: reportId,
        participants: [
          { employee_id: ids.geselle, duration_minutes: 150 },
          { employee_id: ids.azubi, duration_minutes: 120 },
        ],
      }),
    )
    version = r.version
    expect(r.status).toBe('entwurf')
    const entries = await entriesFor(reportId)
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.duration_minutes).sort()).toEqual([120, 150])
    originalEntryIds = entries.map((e) => e.id).sort()
  })

  it('aktualisiert bei Änderung die bestehenden Einträge statt neue anzulegen', async () => {
    const before = await totalEntryCount()
    await db.as(ids.geselleUser)
    const r = await save(
      payload({
        id: reportId,
        expected_version: version,
        report_date: '2026-11-21',
        participants: [
          { employee_id: ids.geselle, duration_minutes: 180 },
          { employee_id: ids.azubi, duration_minutes: 165 },
        ],
      }),
    )
    version = r.version
    const entries = await entriesFor(reportId)
    expect(entries.map((e) => e.id).sort()).toEqual(originalEntryIds)
    expect(entries.every((e) => e.entry_date === '2026-11-21')).toBe(true)
    expect(entries.map((e) => e.duration_minutes).sort()).toEqual([165, 180])
    expect(await totalEntryCount()).toBe(before)
  })

  it('übernimmt Von/Bis/Pause und berechnet die Dauer in Minuten', async () => {
    await db.as(ids.geselleUser)
    const r = await save(
      payload({
        id: reportId,
        expected_version: version,
        report_date: '2026-11-21',
        participants: [
          // 07:30–11:15 Berlin (MEZ = UTC+1) mit 15 min Pause → 210 min
          { employee_id: ids.geselle, started_at: '2026-11-21T06:30:00Z', ended_at: '2026-11-21T10:15:00Z', break_minutes: 15 },
          { employee_id: ids.azubi, duration_minutes: 165 },
        ],
      }),
    )
    version = r.version
    const entries = await entriesFor(reportId)
    expect(entries.find((e) => e.employee_id === ids.geselle)?.duration_minutes).toBe(210)
    expect(entries.map((e) => e.id).sort()).toEqual(originalEntryIds)
  })

  it('wiederholte Anfrage mit gleicher mutation_id ändert nichts (Netzabbruch)', async () => {
    await db.as(ids.geselleUser)
    const p = payload({
      id: reportId,
      expected_version: version,
      report_date: '2026-11-21',
      participants: [
        { employee_id: ids.geselle, duration_minutes: 200 },
        { employee_id: ids.azubi, duration_minutes: 165 },
      ],
    })
    const first = await save(p)
    const replay = await save(p)
    expect(replay.replayed).toBe(true)
    expect(replay.version).toBe(first.version)
    version = first.version
    expect(await entriesFor(reportId)).toHaveLength(2)
  })

  it('lehnt veraltete Versionen ab (keine stillen Überschreibungen)', async () => {
    await db.as(ids.geselleUser)
    await expect(
      save(payload({ id: reportId, expected_version: version - 1, participants: [{ employee_id: ids.geselle, duration_minutes: 60 }] })),
    ).rejects.toThrow(/VERSION_CONFLICT/)
  })

  it('entfernt beim Austragen eines Teilnehmers dessen Zeiteintrag', async () => {
    await db.as(ids.geselleUser)
    const r = await save(
      payload({
        id: reportId,
        expected_version: version,
        report_date: '2026-11-21',
        participants: [{ employee_id: ids.geselle, duration_minutes: 200 }],
      }),
    )
    version = r.version
    const entries = await entriesFor(reportId)
    expect(entries).toHaveLength(1)
    await db.asAdmin()
    const orphan = await db.query('select 1 from public.zeiteintraege where employee_id = $1 and entry_type = $2', [
      ids.azubi,
      'kundenarbeit',
    ])
    expect(orphan.rows).toHaveLength(0)
  })

  it('Einreichen, Freigeben und Korrektur duplizieren keine Zeiteinträge', async () => {
    await db.as(ids.geselleUser)
    let r = await save(
      payload({
        id: reportId,
        expected_version: version,
        report_date: '2026-11-21',
        submit: true,
        participants: [
          { employee_id: ids.geselle, duration_minutes: 150 },
          { employee_id: ids.azubi, duration_minutes: 120 },
        ],
      }),
    )
    expect(r.status).toBe('eingereicht')
    const afterSubmit = await entriesFor(reportId)
    expect(afterSubmit).toHaveLength(2)
    const count = await totalEntryCount()

    await db.as(ids.office)
    const approved = await db.query<{ r: { version: number; status: string } }>(
      `select public.arbeitsbericht_pruefen($1, $2, 'approve', null) as r`,
      [reportId, r.version],
    )
    expect(approved.rows[0].r.status).toBe('freigegeben')
    expect(await totalEntryCount()).toBe(count)

    // Korrektur durch das Büro ohne Begründung wird abgelehnt
    await db.as(ids.office)
    await expect(
      save(
        payload({
          id: reportId,
          expected_version: approved.rows[0].r.version,
          report_date: '2026-11-21',
          participants: [
            { employee_id: ids.geselle, duration_minutes: 135 },
            { employee_id: ids.azubi, duration_minutes: 120 },
          ],
        }),
      ),
    ).rejects.toThrow(/REASON_REQUIRED/)

    await db.as(ids.office)
    r = await save(
      payload({
        id: reportId,
        expected_version: approved.rows[0].r.version,
        report_date: '2026-11-21',
        correction_reason: 'Arbeitszeit laut Rücksprache korrigiert',
        participants: [
          { employee_id: ids.geselle, duration_minutes: 135 },
          { employee_id: ids.azubi, duration_minutes: 120 },
        ],
      }),
    )
    expect(r.status).toBe('freigegeben')
    const afterCorrection = await entriesFor(reportId)
    expect(afterCorrection.map((e) => e.id).sort()).toEqual(afterSubmit.map((e) => e.id).sort())
    expect(await totalEntryCount()).toBe(count)

    await db.asAdmin()
    const audit = await db.query<{ reason: string; old_minutes: number; new_minutes: number }>(
      `select reason, (old_data->>'duration_minutes')::int as old_minutes, (new_data->>'duration_minutes')::int as new_minutes
         from public.aenderungsprotokoll
        where table_name = 'zeiteintraege' and action = 'UPDATE' and reason is not null
        order by id desc limit 1`,
    )
    expect(audit.rows[0]).toEqual({ reason: 'Arbeitszeit laut Rücksprache korrigiert', old_minutes: 150, new_minutes: 135 })
  })

  it('Ersteller kann eingereichte/freigegebene Berichte nicht mehr ändern', async () => {
    await db.asAdmin()
    const current = await db.query<{ version: number }>('select version from public.arbeitsberichte where id = $1', [reportId])
    await db.as(ids.geselleUser)
    await expect(
      save(
        payload({
          id: reportId,
          expected_version: current.rows[0].version,
          participants: [{ employee_id: ids.geselle, duration_minutes: 600 }],
        }),
      ),
    ).rejects.toThrow(/LOCKED/)
  })

  it('Entwurf verwerfen entfernt auch die Zeiteinträge', async () => {
    const draftId = randomUUID()
    await db.as(ids.geselleUser)
    const r = await save(payload({ id: draftId, participants: [{ employee_id: ids.geselle, duration_minutes: 60 }] }))
    expect(await entriesFor(draftId)).toHaveLength(1)
    const before = await totalEntryCount()
    await db.as(ids.geselleUser)
    await db.query('select public.arbeitsbericht_entwurf_loeschen($1, $2)', [draftId, r.version])
    expect(await totalEntryCount()).toBe(before - 1)
  })

  it('Datenbank verhindert doppelte Verknüpfung pro Bericht und Mitarbeiter', async () => {
    await db.asAdmin()
    const entry = await db.query<{ id: string }>(
      `insert into public.zeiteintraege (employee_id, entry_date, entry_type, job_id, duration_minutes, billable)
       values ($1, '2026-11-21', 'kundenarbeit', $2, 30, true) returning id`,
      [ids.geselle, ids.jobA],
    )
    await expect(
      db.query('insert into public.arbeitsbericht_zeiteintraege (work_report_id, time_entry_id, employee_id) values ($1, $2, $3)', [
        reportId,
        entry.rows[0].id,
        ids.geselle,
      ]),
    ).rejects.toThrow(/duplicate key/)
  })

  it('validiert Arbeitszeiten und Pflichtangaben beim Einreichen', async () => {
    await db.as(ids.geselleUser)
    await expect(
      save(payload({ id: randomUUID(), submit: true, activities: [], participants: [{ employee_id: ids.geselle, duration_minutes: 60 }] })),
    ).rejects.toThrow(/INVALID/)
    await db.as(ids.geselleUser)
    await expect(
      save(payload({ id: randomUUID(), participants: [{ employee_id: ids.geselle, duration_minutes: 0 }] })),
    ).rejects.toThrow(/INVALID/)
    await db.as(ids.geselleUser)
    await expect(
      save(payload({ id: randomUUID(), report_date: '2099-01-01', participants: [] })),
    ).rejects.toThrow(/INVALID/)
  })
})
