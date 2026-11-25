import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { Employee } from '../domain/types'
import { endOfMonth } from '../domain/dates'
import { buildTimesheetRows, sumTimesheet, type TimesheetRow } from '../domain/workday'
import { loadAbbreviations, loadAbsences, loadTimeEntries, loadWorkDays } from './time'

export interface EmployeeTimesheet {
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'employee_number' | 'employment_role'>
  rows: TimesheetRow[]
  totalMinutes: number
  workedDays: number
}

/** Stundenzettel eines Monats für alle (oder ausgewählte) Mitarbeiter, die in dem Monat beschäftigt waren. */
export async function loadTimesheets(supabase: ServerSupabase, month: string, employeeId?: string): Promise<EmployeeTimesheet[]> {
  const from = `${month}-01`
  const to = endOfMonth(from)
  let q = supabase
    .from('employees')
    .select('id, first_name, last_name, employee_number, employment_role, start_date, end_date')
    .lte('start_date', to)
    .or(`end_date.is.null,end_date.gte.${from}`)
    .order('last_name')
  if (employeeId) q = q.eq('id', employeeId)
  const { data } = await q
  const employees = (data ?? []) as EmployeeTimesheet['employee'][]
  const ids = employees.map((e) => e.id)
  if (!ids.length) return []

  const [entries, absences, workDays, abbreviations] = await Promise.all([
    loadTimeEntries(supabase, { from, to, employeeIds: ids }),
    loadAbsences(supabase, { from, to, employeeIds: ids }),
    loadWorkDays(supabase, { from, to, employeeIds: ids }),
    loadAbbreviations(supabase),
  ])

  return employees.map((employee) => {
    const rows = buildTimesheetRows({
      month,
      entries: entries.filter((e) => e.employee_id === employee.id),
      absences: absences.filter((a) => a.employee_id === employee.id),
      workDays: workDays.filter((w) => w.employee_id === employee.id),
      abbreviations,
    })
    const sum = sumTimesheet(rows)
    return { employee, rows, totalMinutes: sum.minutes, workedDays: sum.days }
  })
}
