import { berlinToday, utcToBerlinTime } from './domain/dates'
import type { ReportStatus } from './domain/types'

export interface ActivityRow {
  id: string
  description: string
}

export interface MaterialRow {
  id: string
  description: string
  quantity: string
  unit: string
  manufacturer: string
  article_number: string
  supplier_article_number: string
  supplier_reference: string
  catalog_article_id: string | null
}

export interface ParticipantRow {
  employee_id: string
  minutes: number
  useSpan: boolean
  start_time: string
  end_time: string
  break_minutes: number
}

export interface ReportFormState {
  job_id: string | null
  report_date: string
  internal_notes: string
  activities: ActivityRow[]
  materials: MaterialRow[]
  participants: ParticipantRow[]
}

export interface ReportFormInitial {
  id: string
  isNew: boolean
  version: number | null
  status: ReportStatus
  reviewComment: string | null
  state: ReportFormState
}

const uuid = () => crypto.randomUUID()

export function emptyMaterial(): MaterialRow {
  return {
    id: uuid(),
    description: '',
    quantity: '1',
    unit: 'Stk',
    manufacturer: '',
    article_number: '',
    supplier_article_number: '',
    supplier_reference: '',
    catalog_article_id: null,
  }
}

export function newReportState(opts: { jobId: string | null; employeeId: string | null; date?: string }): ReportFormState {
  return {
    job_id: opts.jobId,
    report_date: opts.date ?? berlinToday(),
    internal_notes: '',
    activities: [{ id: uuid(), description: '' }],
    materials: [],
    participants: opts.employeeId
      ? [{ employee_id: opts.employeeId, minutes: 0, useSpan: false, start_time: '07:30', end_time: '16:00', break_minutes: 30 }]
      : [],
  }
}

export interface ReportDetailRow {
  id: string
  job_id: string
  report_date: string
  internal_notes: string | null
  activities: { id: string; position: number; description: string }[]
  materials: {
    id: string
    position: number
    description: string
    quantity: number
    unit: string
    manufacturer: string | null
    article_number: string | null
    supplier_article_number: string | null
    supplier_reference: string | null
    catalog_article_id: string | null
  }[]
  time_links: {
    employee_id: string
    time_entry: { duration_minutes: number; started_at: string | null; ended_at: string | null; break_minutes: number } | null
  }[]
}

/** Gespeicherten Bericht in Formularzustand überführen. */
export function reportToFormState(r: ReportDetailRow): ReportFormState {
  return {
    job_id: r.job_id,
    report_date: r.report_date,
    internal_notes: r.internal_notes ?? '',
    activities: [...r.activities]
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ id: a.id, description: a.description })),
    materials: [...r.materials]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        description: m.description,
        quantity: String(m.quantity).replace('.', ','),
        unit: m.unit,
        manufacturer: m.manufacturer ?? '',
        article_number: m.article_number ?? '',
        supplier_article_number: m.supplier_article_number ?? '',
        supplier_reference: m.supplier_reference ?? '',
        catalog_article_id: m.catalog_article_id,
      })),
    participants: r.time_links.map((l) => {
      const t = l.time_entry
      const useSpan = !!(t?.started_at && t?.ended_at)
      return {
        employee_id: l.employee_id,
        minutes: t?.duration_minutes ?? 0,
        useSpan,
        start_time: useSpan ? utcToBerlinTime(t!.started_at!) : '07:30',
        end_time: useSpan ? utcToBerlinTime(t!.ended_at!) : '16:00',
        break_minutes: t?.break_minutes ?? 0,
      }
    }),
  }
}
