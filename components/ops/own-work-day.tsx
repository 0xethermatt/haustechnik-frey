import { createClient } from '@/lib/ops/supabase/server'
import type { SessionContext } from '@/lib/ops/auth'
import { loadAbsences, loadWorkDays } from '@/lib/ops/data/time'
import { berlinToday } from '@/lib/ops/domain/dates'
import { absenceOn, isRegularWorkday } from '@/lib/ops/domain/time'
import { defaultScheduleFor } from '@/lib/ops/domain/workday'
import { WorkDayCard } from './work-day-card'

/** Eigene Arbeitszeit von heute – auch für Büro/Admin mit eigenem Mitarbeiterdatensatz. */
export async function OwnWorkDay({ ctx, className }: { ctx: SessionContext; className?: string }) {
  const employee = ctx.employee
  if (!employee) return null
  const today = berlinToday()
  const supabase = createClient()
  const [absences, workDays] = await Promise.all([
    loadAbsences(supabase, { from: today, to: today, employeeIds: [employee.id] }),
    loadWorkDays(supabase, { from: today, to: today, employeeIds: [employee.id] }),
  ])
  const absence = absenceOn(today, absences)
  const isApprentice = employee.employment_role === 'auszubildender'
  const visible = (!absence || (isApprentice && absence.absence_type === 'berufsschule')) && (isRegularWorkday(today) || !!absence)
  if (!visible) return null
  const workDay = workDays[0]
  return (
    <WorkDayCard
      key={workDay?.id ?? 'neu'}
      className={className}
      employeeId={employee.id}
      date={today}
      workDay={workDay}
      defaults={defaultScheduleFor(today)}
      title="Meine Arbeitszeit heute"
      canSchool={isApprentice}
      schoolDefault={absence?.absence_type === 'berufsschule'}
    />
  )
}
