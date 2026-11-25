import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { buildDays, loadAbsences, loadTimeEntries, sumDays, type EmployeeDay } from '@/lib/ops/data/time'
import {
  addDays,
  berlinToday,
  endOfMonth,
  formatDate,
  formatMonth,
  isIsoDate,
  isoWeekNumber,
  startOfMonth,
  startOfWeek,
  weekdayLabel,
} from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { ABSENCE_TYPE_LABELS, EMPLOYMENT_ROLE_LABELS } from '@/lib/ops/domain/labels'
import type { Employee } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { FlagDot } from '@/components/ops/time-views'
import { Button } from '@/components/ui/button'
import { cn, fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Zeitübersicht' }

export default async function TimeOverviewPage({ searchParams }: { searchParams: { ansicht?: string; datum?: string } }) {
  await requireOffice()
  const supabase = createClient()
  const today = berlinToday()
  const view = searchParams.ansicht === 'monat' ? 'monat' : 'woche'
  const anchor = searchParams.datum && isIsoDate(searchParams.datum) ? searchParams.datum : today
  const from = view === 'woche' ? startOfWeek(anchor) : startOfMonth(anchor)
  const to = view === 'woche' ? addDays(from, 6) : endOfMonth(anchor)
  const prev = view === 'woche' ? addDays(from, -7) : startOfMonth(addDays(from, -1))
  const next = view === 'woche' ? addDays(from, 7) : addDays(to, 1)

  const { data: employeesData } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_role, is_active, start_date, end_date, weekly_target_minutes')
    .lte('start_date', to)
    .or(`end_date.is.null,end_date.gte.${from}`)
    .order('last_name')
  const employees = (employeesData ?? []) as Employee[]
  const ids = employees.map((e) => e.id)
  const [entries, absences] = await Promise.all([
    loadTimeEntries(supabase, { from, to, employeeIds: ids }),
    loadAbsences(supabase, { from, to, employeeIds: ids }),
  ])

  const rows = employees.map((e) => {
    const days = buildDays({
      from,
      to,
      today,
      entries: entries.filter((x) => x.employee_id === e.id),
      absences: absences.filter((a) => a.employee_id === e.id),
      employment: e,
    })
    return { employee: e, days, total: sumDays(days), issues: days.flatMap((d) => d.flags).filter((f) => f.severity !== 'info').length }
  })
  const weeks = [...new Set(rows[0]?.days.map((d) => startOfWeek(d.date)) ?? [])]

  const link = (patch: { ansicht?: string; datum?: string }) => {
    const p = new URLSearchParams({ ansicht: patch.ansicht ?? view, datum: patch.datum ?? anchor })
    return `/intern/zeiten/uebersicht?${p}`
  }
  const dayHref = (employeeId: string, date: string) => `/intern/zeiten?mitarbeiter=${employeeId}&datum=${date}`

  return (
    <>
      <PageHeader
        title="Zeitübersicht"
        description={view === 'woche' ? `KW ${isoWeekNumber(from)} · ${formatDate(from)} – ${formatDate(to)}` : formatMonth(from)}
        actions={
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['woche', 'monat'] as const).map((v) => (
              <Link
                key={v}
                href={link({ ansicht: v })}
                className={cn('rounded-md px-4 py-1.5 text-sm text-muted-foreground', view === v && 'bg-background font-medium text-foreground shadow-sm')}
              >
                {v === 'woche' ? 'Woche' : 'Monat'}
              </Link>
            ))}
          </div>
        }
      />
      <PageBody>
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={link({ datum: prev })}>
              <ChevronLeft /> Zurück
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={link({ datum: today })}>Aktuell</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={link({ datum: next })}>
              Weiter <ChevronRight />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">Mitarbeiter</th>
                {view === 'woche'
                  ? rows[0]?.days.map((d) => (
                      <th key={d.date} className={cn('px-2 py-3 text-center font-medium', d.date === today && 'text-primary')}>
                        {weekdayLabel(d.date)} {formatDate(d.date).slice(0, 6)}
                      </th>
                    ))
                  : weeks.map((w) => (
                      <th key={w} className="px-2 py-3 text-center font-medium">
                        KW {isoWeekNumber(w)}
                      </th>
                    ))}
                <th className="px-3 py-3 text-right font-medium">Arbeitszeit</th>
                <th className="px-3 py-3 text-right font-medium">Verrechenbar</th>
                <th className="px-3 py-3 text-right font-medium">Nicht verr.</th>
                <th className="px-3 py-3 text-right font-medium">Hinweise</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(({ employee, days, total, issues }) => (
                <tr key={employee.id} className="hover:bg-muted/40">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3">
                    <Link href={dayHref(employee.id, to < today ? to : today)} className="font-medium hover:underline">
                      {fullName(employee)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {EMPLOYMENT_ROLE_LABELS[employee.employment_role]}
                      {view === 'woche' ? ` · Soll lt. Vertrag ${formatMinutes(employee.weekly_target_minutes)}` : ''}
                    </div>
                  </td>
                  {view === 'woche'
                    ? days.map((d) => <DayCell key={d.date} day={d} href={dayHref(employee.id, d.date)} today={today} />)
                    : weeks.map((w) => {
                        const wd = days.filter((d) => startOfWeek(d.date) === w)
                        const flags = wd.flatMap((d) => d.flags)
                        return (
                          <td key={w} className="px-2 py-3 text-center">
                            <div className="tabular">{formatMinutes(sumDays(wd).workMinutes, false)}</div>
                            <FlagDot flags={flags} />
                          </td>
                        )
                      })}
                  <td className="tabular px-3 py-3 text-right font-semibold">{formatMinutes(total.workMinutes)}</td>
                  <td className="tabular px-3 py-3 text-right">{formatMinutes(total.billableMinutes)}</td>
                  <td className="tabular px-3 py-3 text-right">{formatMinutes(total.nonBillableMinutes)}</td>
                  <td className={cn('px-3 py-3 text-right', issues ? 'font-medium text-warning' : 'text-muted-foreground')}>{issues || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Reine Erfassungsübersicht. Überstunden-, Urlaubs- und Lohnberechnungen sind bewusst nicht enthalten, bis die Regeln abgestimmt sind.
        </p>
      </PageBody>
    </>
  )
}

function DayCell({ day, href, today }: { day: EmployeeDay; href: string; today: string }) {
  const future = day.date > today
  return (
    <td className={cn('px-1 py-2 text-center', (day.holiday || day.absence) && 'bg-muted/50')}>
      <Link href={future ? '#' : href} className={cn('block rounded-lg px-1 py-1', !future && 'hover:bg-accent')} aria-disabled={future}>
        <div className="tabular">
          {day.summary.workMinutes ? (
            formatMinutes(day.summary.workMinutes, false)
          ) : day.absence ? (
            <span className="text-xs text-muted-foreground">{ABSENCE_TYPE_LABELS[day.absence.absence_type]}</span>
          ) : day.holiday ? (
            <span className="text-xs text-muted-foreground">Feiertag</span>
          ) : (
            <span className="text-muted-foreground">–</span>
          )}
        </div>
        <div className="h-2">
          <FlagDot flags={day.flags} />
        </div>
      </Link>
    </td>
  )
}
