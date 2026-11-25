import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { customerSchema, timeEntrySchema, workReportSchema } from '@/lib/ops/validation/schemas'
import { toRpcPayload } from '@/lib/ops/reports'
import { summarizeReportAudit } from '@/lib/ops/domain/audit'

const emp = randomUUID()
const base = {
  id: randomUUID(),
  mutation_id: randomUUID(),
  expected_version: null,
  job_id: randomUUID(),
  report_date: '2026-11-24',
  internal_notes: '',
  activities: [{ id: randomUUID(), description: 'Waschtisch montiert' }],
  materials: [{ id: randomUUID(), description: 'Waschtisch', quantity: 1, unit: 'Stk' }],
  participants: [{ employee_id: emp, duration_minutes: 150 }],
  submit: true,
}

describe('Arbeitsbericht-Validierung (Server)', () => {
  it('akzeptiert einen vollständigen Bericht', () => {
    expect(workReportSchema.safeParse(base).success).toBe(true)
  })
  it('verlangt beim Einreichen Tätigkeiten und Teilnehmer, nicht aber im Entwurf', () => {
    expect(workReportSchema.safeParse({ ...base, activities: [] }).success).toBe(false)
    expect(workReportSchema.safeParse({ ...base, participants: [] }).success).toBe(false)
    expect(workReportSchema.safeParse({ ...base, activities: [], participants: [], submit: false }).success).toBe(true)
  })
  it('verhindert doppelte Teilnehmer und ungültige Mengen', () => {
    expect(workReportSchema.safeParse({ ...base, participants: [...base.participants, ...base.participants] }).success).toBe(false)
    expect(workReportSchema.safeParse({ ...base, materials: [{ ...base.materials[0], quantity: 0 }] }).success).toBe(false)
  })
  it('wandelt Von/Bis in UTC-Zeitpunkte und ganze Minuten um', () => {
    const parsed = workReportSchema.parse({
      ...base,
      participants: [{ employee_id: emp, duration_minutes: 1, start_time: '07:30', end_time: '11:15', break_minutes: 15 }],
    })
    expect(toRpcPayload(parsed).participants[0]).toEqual({
      employee_id: emp,
      started_at: '2026-11-24T06:30:00.000Z',
      ended_at: '2026-11-24T10:15:00.000Z',
      break_minutes: 15,
      duration_minutes: 210,
    })
  })
})

describe('Weitere Schemas', () => {
  it('Kunde braucht Nachname oder Firma und gültige PLZ', () => {
    expect(customerSchema.safeParse({ first_name: 'Hans' }).success).toBe(false)
    expect(customerSchema.safeParse({ company_name: 'Bäckerei Hofmann GmbH' }).success).toBe(true)
    expect(customerSchema.safeParse({ last_name: 'Müller', billing_postal_code: '8912' }).success).toBe(false)
  })
  it('nur Fahrzeit mit Auftrag ist verrechenbar; keine Kundenarbeit ohne Bericht', () => {
    const t = { employee_id: emp, entry_date: '2026-11-24', duration_minutes: 30 }
    expect(timeEntrySchema.safeParse({ ...t, entry_type: 'fahrzeit', job_id: randomUUID(), billable: true }).success).toBe(true)
    expect(timeEntrySchema.safeParse({ ...t, entry_type: 'lager', billable: true }).success).toBe(false)
    expect(timeEntrySchema.safeParse({ ...t, entry_type: 'kundenarbeit' }).success).toBe(false)
  })
})

describe('Änderungsverlauf', () => {
  it('fasst Korrekturen lesbar zusammen', () => {
    const events = summarizeReportAudit(
      [
        { id: 1, table_name: 'arbeitsberichte', record_id: 'r', action: 'INSERT', actor_id: null, reason: null, old_data: null, new_data: { status: 'entwurf' }, changed_at: '' },
        { id: 2, table_name: 'arbeitsberichte', record_id: 'r', action: 'UPDATE', actor_id: null, reason: null, old_data: { status: 'eingereicht' }, new_data: { status: 'freigegeben' }, changed_at: '' },
        { id: 3, table_name: 'zeiteintraege', record_id: 't', action: 'UPDATE', actor_id: null, reason: 'Rücksprache', old_data: { employee_id: 'e', duration_minutes: 150 }, new_data: { employee_id: 'e', duration_minutes: 135 }, changed_at: '' },
      ],
      () => 'Jonas Keller',
    )
    expect(events.map((e) => e.text)).toEqual(['Bericht angelegt', 'Bericht freigegeben', 'Arbeitszeit Jonas Keller: 2:30 h → 2:15 h'])
    expect(events[2].reason).toBe('Rücksprache')
  })
})
