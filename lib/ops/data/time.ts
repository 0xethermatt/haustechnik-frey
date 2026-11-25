import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { AbsenceType, ReportStatus, TimeEntryType } from '../domain/types'
import { eachDay } from '../domain/dates'
import { holidayName } from '../domain/holidays'
import { absenceOn, analyzeDay, dayTotals, sumTotals, type DayFlag, type DayTotals } from '../domain/time'

export interface TimeEntryRow {
  id: string
  employee_id: string
  entry_date: string
  entry_type: TimeEntryType
  job_id: string | null
  started_at: string | null
  ended_at: string | null
  break_minutes: number
  duration_minutes: number
  billable: boolean
  note: string | null
  job: {
    id: string
    job_number: number
    title: string
    customer: { first_name: string | null; last_name: string | null; company_name: string | null; short_name: string | null; billing_city: string | null } | null
    location: { city: string } | null
  } | null
  link: { work_report_id: string; report: { status: ReportStatus; report_number: number } | null }[]
}

export interface AbsenceRow {
  id: string
  employee_id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  half_day: boolean
  note: string | null
}

export async function loadTimeEntries(
  supabase: ServerSupabase,
  { from, to, employeeIds }: { from: string; to: string; employeeIds?: string[] },
): Promise<TimeEntryRow[]> {
  let q = supabase
    .from('time_entries')
    .select(
      `id, employee_id, entry_date, entry_type, job_id, started_at, ended_at, break_minutes, duration_minutes, billable, note,
       job:jobs(id, job_number, title, customer:customers(first_name, last_name, company_name, short_name, billing_city), location:service_locations(city)),
       link:work_report_time_entries(work_report_id, report:work_reports(status, report_number))`,
    )
    .gte('entry_date', from)
    .lte('entry_date', to)
  if (employeeIds) q = q.in('employee_id', employeeIds)
  const { data } = await q.order('entry_date').order('started_at', { ascending: true, nullsFirst: false })
  return ((data ?? []) as unknown as TimeEntryRow[]).map((e) => ({ ...e, link: Array.isArray(e.link) ? e.link : e.link ? [e.link] : [] }))
}

export async function loadAbsences(
  supabase: ServerSupabase,
  { from, to, employeeIds }: { from: string; to: string; employeeIds?: string[] },
): Promise<AbsenceRow[]> {
  let q = supabase
    .from('employee_absences')
    .select('id, employee_id, absence_type, start_date, end_date, half_day, note')
    .lte('start_date', to)
    .gte('end_date', from)
  if (employeeIds) q = q.in('employee_id', employeeIds)
  const { data } = await q.order('start_date')
  return (data ?? []) as AbsenceRow[]
}

export interface WorkDayRow {
  id: string
  employee_id: string
  work_date: string
  start_time: string
  end_time: string
  break_minutes: number
  duration_minutes: number
  note: string | null
  created_at: string
}

export async function loadWorkDays(
  supabase: ServerSupabase,
  { from, to, employeeIds }: { from: string; to: string; employeeIds?: string[] },
): Promise<WorkDayRow[]> {
  let q = supabase
    .from('work_days')
    .select('id, employee_id, work_date, start_time, end_time, break_minutes, duration_minutes, note, created_at')
    .gte('work_date', from)
    .lte('work_date', to)
  if (employeeIds) q = q.in('employee_id', employeeIds)
  const { data } = await q.order('work_date')
  return (data ?? []) as WorkDayRow[]
}

export async function loadAbbreviations(supabase: ServerSupabase): Promise<Map<string, string>> {
  const { data } = await supabase.from('place_abbreviations').select('city, abbreviation')
  return new Map((data ?? []).map((r) => [r.city.trim().toLowerCase(), r.abbreviation]))
}

export interface EmployeeDay {
  date: string
  totals: DayTotals
  workDay: WorkDayRow | undefined
  flags: DayFlag[]
  absence: AbsenceRow | undefined
  holiday: string | undefined
  entries: TimeEntryRow[]
}

export function buildDays(opts: {
  from: string
  to: string
  today: string
  entries: TimeEntryRow[]
  absences: AbsenceRow[]
  workDays?: WorkDayRow[]
  employment?: { start_date: string; end_date: string | null }
}): EmployeeDay[] {
  return eachDay(opts.from, opts.to).map((date) => {
    const entries = opts.entries.filter((e) => e.entry_date === date)
    const employed = opts.employment
      ? date >= opts.employment.start_date && (!opts.employment.end_date || date <= opts.employment.end_date)
      : true
    const openDraftCount = new Set(
      entries
        .filter((e) => e.link[0]?.report && ['entwurf', 'korrektur_erforderlich'].includes(e.link[0].report.status))
        .map((e) => e.link[0].work_report_id),
    ).size
    const workDay = opts.workDays?.find((w) => w.work_date === date)
    return {
      date,
      entries,
      workDay,
      totals: dayTotals(entries, workDay),
      flags: analyzeDay({ date, today: opts.today, entries, absences: opts.absences, workDay, openDraftCount, employed }),
      absence: absenceOn(date, opts.absences) as AbsenceRow | undefined,
      holiday: holidayName(date),
    }
  })
}

export function sumDays(days: EmployeeDay[]): DayTotals {
  return sumTotals(days.map((d) => d.totals))
}
