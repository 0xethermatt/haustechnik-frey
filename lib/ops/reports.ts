import { berlinLocalToUtc } from './domain/dates'
import { durationFromSpan } from './domain/time'
import type { z } from 'zod'
import type { workReportSchema } from './validation/schemas'

type ParsedReport = z.output<typeof workReportSchema>

/**
 * Wandelt validierte Formulardaten in das RPC-Format um. Uhrzeiten werden als
 * Berliner Ortszeit am Berichtstag interpretiert; die Dauer wird daraus berechnet.
 */
export function toRpcPayload(r: ParsedReport) {
  return {
    id: r.id,
    mutation_id: r.mutation_id,
    expected_version: r.expected_version,
    job_id: r.job_id,
    report_date: r.report_date,
    internal_notes: r.internal_notes,
    correction_reason: r.correction_reason,
    submit: r.submit,
    activities: r.activities.map((a) => ({ id: a.id, description: a.description })),
    materials: r.materials,
    participants: r.participants.map((p) => {
      if (p.start_time && p.end_time) {
        const started_at = berlinLocalToUtc(r.report_date, p.start_time)
        const ended_at = berlinLocalToUtc(r.report_date, p.end_time)
        const duration = durationFromSpan(started_at, ended_at, p.break_minutes)
        if (!duration) throw new SpanError()
        return { employee_id: p.employee_id, started_at, ended_at, break_minutes: p.break_minutes, duration_minutes: duration }
      }
      return { employee_id: p.employee_id, duration_minutes: p.duration_minutes, break_minutes: 0 }
    }),
  }
}

export class SpanError extends Error {
  constructor() {
    super('Die Pause ist länger als die Arbeitszeit.')
  }
}
