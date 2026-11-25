import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestDb, ids, seedBase, type Db } from './harness'

let db: Db

beforeAll(async () => {
  db = await createTestDb()
  await seedBase(db)
})

async function count(table: string) {
  const res = await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`)
  return res.rows[0].n
}

async function reportAs(userId: string, jobId: string, participants: { employee_id: string; duration_minutes: number }[]) {
  await db.as(userId)
  const res = await db.query<{ r: { id: string; version: number } }>('select public.save_work_report($1::jsonb) as r', [
    JSON.stringify({
      id: randomUUID(),
      mutation_id: randomUUID(),
      expected_version: null,
      job_id: jobId,
      report_date: '2026-11-20',
      activities: [{ id: randomUUID(), description: 'Heizung gewartet' }],
      materials: [],
      participants,
      submit: true,
    }),
  ])
  return res.rows[0].r
}

describe('Anonym', () => {
  it('hat keinerlei Zugriff', async () => {
    await db.as(null)
    for (const table of ['customers', 'jobs', 'employees', 'time_entries', 'work_reports', 'audit_logs']) {
      await expect(db.query(`select * from public.${table}`)).rejects.toThrow(/permission denied/)
    }
    await expect(db.query(`select public.save_work_report('{}'::jsonb)`)).rejects.toThrow(/permission denied/)
  })
})

describe('Benutzer ohne Rolle', () => {
  it('sieht keine Daten und kann nichts anlegen', async () => {
    await db.as(ids.noRoleUser)
    expect(await count('customers')).toBe(0)
    expect(await count('jobs')).toBe(0)
    expect(await count('employees')).toBe(0)
    expect((await db.query('select * from public.employee_directory()')).rows).toHaveLength(0)
    await expect(
      db.query(`insert into public.customers (last_name, created_by) values ('Test', $1)`, [ids.noRoleUser]),
    ).rejects.toThrow(/row-level security/)
  })
})

describe('Mitarbeiter', () => {
  it('sieht nur zugewiesene Aufträge und deren Kunden', async () => {
    await db.as(ids.geselleUser)
    const jobs = await db.query<{ id: string }>('select id from public.jobs')
    expect(jobs.rows.map((r) => r.id)).toEqual([ids.jobA])
    const customers = await db.query<{ id: string }>('select id from public.customers')
    expect(customers.rows.map((r) => r.id)).toEqual([ids.customerA])
  })

  it('sieht nur den eigenen Mitarbeiterdatensatz, Kollegen nur über das Verzeichnis (ohne Vertragsdaten)', async () => {
    await db.as(ids.geselleUser)
    const own = await db.query<{ id: string }>('select id from public.employees')
    expect(own.rows.map((r) => r.id)).toEqual([ids.geselle])
    const dir = await db.query<Record<string, unknown>>('select * from public.employee_directory()')
    expect(dir.rows).toHaveLength(3)
    expect(Object.keys(dir.rows[0])).not.toContain('weekly_target_minutes')
  })

  it('kann Kunden anlegen und sieht diese danach, aber nicht bearbeiten', async () => {
    await db.as(ids.geselleUser)
    const created = await db.query<{ id: string }>(
      `insert into public.customers (last_name, first_name, billing_postal_code, billing_city, created_by)
       values ('Neumann', 'Klaus', '89129', 'Langenau', $1) returning id`,
      [ids.geselleUser],
    )
    expect(created.rows).toHaveLength(1)
    const upd = await db.query(`update public.customers set notes = 'x' where id = $1`, [created.rows[0].id])
    expect(upd.affectedRows).toBe(0)
  })

  it('kann Aufträge anlegen und wird automatisch zugewiesen', async () => {
    await db.as(ids.geselleUser)
    const job = await db.query<{ id: string }>(
      `insert into public.jobs (customer_id, title, category, created_by) values ($1, 'Ablauf reparieren', 'reparatur', $2) returning id`,
      [ids.customerB, ids.geselleUser],
    )
    const assignment = await db.query('select * from public.job_assignments where job_id = $1 and employee_id = $2', [
      job.rows[0].id,
      ids.geselle,
    ])
    expect(assignment.rows).toHaveLength(1)
    // Kunde B ist nun über den eigenen Auftrag sichtbar
    const visible = await db.query('select id from public.customers where id = $1', [ids.customerB])
    expect(visible.rows).toHaveLength(1)
  })

  it('kann Aufträge, Zuweisungen und Mitarbeiter nicht verändern', async () => {
    await db.as(ids.geselleUser)
    expect((await db.query(`update public.jobs set status = 'abgerechnet' where id = $1`, [ids.jobA])).affectedRows).toBe(0)
    await expect(
      db.query('insert into public.job_assignments (job_id, employee_id) values ($1, $2)', [ids.jobB, ids.geselle]),
    ).rejects.toThrow(/row-level security/)
    expect(
      (await db.query(`update public.employees set weekly_target_minutes = 0 where id = $1`, [ids.geselle])).affectedRows,
    ).toBe(0)
  })

  it('kann keine Berichte für fremde Aufträge anlegen', async () => {
    await expect(reportAs(ids.geselleUser, ids.jobB, [{ employee_id: ids.geselle, duration_minutes: 60 }])).rejects.toThrow(
      /FORBIDDEN/,
    )
  })

  it('kann Berichte nicht direkt schreiben oder freigeben', async () => {
    const report = await reportAs(ids.geselleUser, ids.jobA, [{ employee_id: ids.geselle, duration_minutes: 90 }])
    await db.as(ids.geselleUser)
    expect(
      (await db.query(`update public.work_reports set status = 'freigegeben' where id = $1`, [report.id])).affectedRows,
    ).toBe(0)
    await expect(
      db.query(`select public.review_work_report($1, $2, 'approve', null)`, [report.id, report.version]),
    ).rejects.toThrow(/FORBIDDEN/)
  })

  it('kann eigene Nicht-Kunden-Zeiten erfassen, aber keine Kundenarbeit direkt und keine fremden Zeiten', async () => {
    await db.as(ids.geselleUser)
    const ok = await db.query(
      `insert into public.time_entries (employee_id, entry_date, entry_type, duration_minutes) values ($1, '2026-11-20', 'lager', 45) returning id`,
      [ids.geselle],
    )
    expect(ok.rows).toHaveLength(1)
    await expect(
      db.query(
        `insert into public.time_entries (employee_id, entry_date, entry_type, job_id, duration_minutes, billable) values ($1, '2026-11-20', 'kundenarbeit', $2, 45, true)`,
        [ids.geselle, ids.jobA],
      ),
    ).rejects.toThrow(/row-level security/)
    await expect(
      db.query(
        `insert into public.time_entries (employee_id, entry_date, entry_type, duration_minutes) values ($1, '2026-11-20', 'lager', 45)`,
        [ids.other],
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('kann berichtsgebundene Zeiteinträge nicht direkt ändern oder löschen', async () => {
    await db.as(ids.geselleUser)
    const linked = await db.query<{ id: string }>(
      `select t.id from public.time_entries t join public.work_report_time_entries l on l.time_entry_id = t.id limit 1`,
    )
    expect(linked.rows).toHaveLength(1)
    expect(
      (await db.query('update public.time_entries set duration_minutes = 1 where id = $1', [linked.rows[0].id])).affectedRows,
    ).toBe(0)
    expect((await db.query('delete from public.time_entries where id = $1', [linked.rows[0].id])).affectedRows).toBe(0)
  })

  it('sieht keine Zeiten von Kollegen außerhalb gemeinsamer Berichte', async () => {
    await reportAs(ids.otherUser, ids.jobB, [{ employee_id: ids.other, duration_minutes: 120 }])
    await db.as(ids.geselleUser)
    const foreign = await db.query('select * from public.time_entries where employee_id = $1', [ids.other])
    expect(foreign.rows).toHaveLength(0)
    const foreignReports = await db.query('select r.* from public.work_reports r where r.job_id = $1', [ids.jobB])
    expect(foreignReports.rows).toHaveLength(0)
  })

  it('kann weder Audit-Log lesen noch Rollen vergeben', async () => {
    await db.as(ids.geselleUser)
    expect(await count('audit_logs')).toBe(0)
    await expect(
      db.query(`select public.admin_set_user_access($1, '{admin}', true, null, null)`, [ids.geselleUser]),
    ).rejects.toThrow(/FORBIDDEN/)
    expect((await db.query(`update public.profiles set roles = '{admin}' where id = $1`, [ids.geselleUser])).affectedRows).toBe(0)
  })
})

describe('Büro', () => {
  it('sieht alle Kunden, Aufträge, Mitarbeiter und Zeiten', async () => {
    await db.as(ids.office)
    expect(await count('jobs')).toBeGreaterThanOrEqual(2)
    expect(await count('employees')).toBe(3)
    const entries = await db.query('select distinct employee_id from public.time_entries')
    expect(entries.rows.length).toBeGreaterThanOrEqual(2)
    expect(await count('audit_logs')).toBeGreaterThan(0)
  })

  it('kann Aufträge verwalten, Mitarbeiter zuweisen und Berichte freigeben', async () => {
    await db.as(ids.office)
    expect((await db.query(`update public.jobs set status = 'abgeschlossen' where id = $1`, [ids.jobB])).affectedRows).toBe(1)
    await db.query('insert into public.job_assignments (job_id, employee_id) values ($1, $2)', [ids.jobB, ids.azubi])
    const report = await reportAs(ids.otherUser, ids.jobB, [{ employee_id: ids.other, duration_minutes: 30 }])
    await db.as(ids.office)
    const res = await db.query<{ r: { status: string } }>(`select public.review_work_report($1, $2, 'approve', null) as r`, [
      report.id,
      report.version,
    ])
    expect(res.rows[0].r.status).toBe('freigegeben')
  })

  it('Korrekturanforderung braucht eine Begründung', async () => {
    const report = await reportAs(ids.geselleUser, ids.jobA, [{ employee_id: ids.geselle, duration_minutes: 30 }])
    await db.as(ids.office)
    await expect(
      db.query(`select public.review_work_report($1, $2, 'request_correction', '  ')`, [report.id, report.version]),
    ).rejects.toThrow(/REASON_REQUIRED/)
    const res = await db.query<{ r: { status: string } }>(
      `select public.review_work_report($1, $2, 'request_correction', 'Material fehlt') as r`,
      [report.id, report.version],
    )
    expect(res.rows[0].r.status).toBe('korrektur_erforderlich')
  })

  it('kann keine Rollen vergeben und das Audit-Log nicht verändern', async () => {
    await db.as(ids.office)
    await expect(
      db.query(`select public.admin_set_user_access($1, '{admin}', true, null, null)`, [ids.office]),
    ).rejects.toThrow(/FORBIDDEN/)
    await expect(db.query('delete from public.audit_logs')).rejects.toThrow(/permission denied/)
  })

  it('kann Kunden nicht löschen (nur archivieren)', async () => {
    await db.as(ids.office)
    expect((await db.query('delete from public.customers where id = $1', [ids.customerA])).affectedRows).toBe(0)
    expect(
      (await db.query('update public.customers set archived_at = now() where id = $1', [ids.customerB])).affectedRows,
    ).toBe(1)
    await db.query('update public.customers set archived_at = null where id = $1', [ids.customerB])
  })
})

describe('Admin', () => {
  it('kann Rollen vergeben und Mitarbeiter verknüpfen', async () => {
    await db.as(ids.admin)
    await db.query(`select public.admin_set_user_access($1, '{employee,office}', true, 'Lena Schmid', $2)`, [
      ids.noRoleUser,
      ids.azubi,
    ])
    await db.asAdmin()
    const p = await db.query<{ roles: string }>('select roles::text from public.profiles where id = $1', [ids.noRoleUser])
    expect(p.rows[0].roles).toBe('{office,employee}')
    const e = await db.query<{ profile_id: string }>('select profile_id from public.employees where id = $1', [ids.azubi])
    expect(e.rows[0].profile_id).toBe(ids.noRoleUser)
  })

  it('kann den letzten aktiven Admin nicht entfernen', async () => {
    await db.as(ids.admin)
    await expect(db.query(`select public.admin_set_user_access($1, '{office}', true, null, null)`, [ids.admin])).rejects.toMatchObject({
      message: 'INVALID',
      detail: expect.stringMatching(/mindestens ein aktiver Administrator/),
    })
  })

  it('deaktivierte Benutzer verlieren sofort jeden Zugriff', async () => {
    await db.as(ids.admin)
    await db.query(`select public.admin_set_user_access($1, '{employee}', false, null, null)`, [ids.otherUser])
    await db.as(ids.otherUser)
    expect(await count('jobs')).toBe(0)
    expect(await count('time_entries')).toBe(0)
  })
})

describe('Dublettenprüfung', () => {
  it('findet Kunden über Telefon, E-Mail und Name+PLZ – mit minimalen Daten', async () => {
    await db.as(ids.geselleUser)
    const byPhone = await db.query<{ id: string; match_reason: string }>(
      `select * from public.find_customer_duplicates(p_phone => '0731/998877')`,
    )
    expect(byPhone.rows[0]).toMatchObject({ id: ids.customerB, match_reason: 'Telefonnummer' })

    const byName = await db.query<{ id: string }>(
      `select * from public.find_customer_duplicates(p_first_name => 'Hans', p_last_name => 'Mueller', p_postal_code => '89129')`,
    )
    expect(byName.rows.map((r) => r.id)).toContain(ids.customerA)

    const byEmail = await db.query<{ id: string; match_reason: string }>(
      `select * from public.find_customer_duplicates(p_email => 'HANS.MUELLER@example.de')`,
    )
    expect(byEmail.rows[0]).toMatchObject({ id: ids.customerA, match_reason: 'E-Mail' })

    const none = await db.query(`select * from public.find_customer_duplicates(p_last_name => 'Zimmermann', p_postal_code => '10115')`)
    expect(none.rows).toHaveLength(0)
  })
})
