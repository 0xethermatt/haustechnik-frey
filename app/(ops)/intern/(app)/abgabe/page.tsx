import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Minus } from 'lucide-react'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadAbsences, loadTimeEntries, loadWorkDays, type TimeEntryRow } from '@/lib/ops/data/time'
import { addDays, berlinToday, eachDay, formatDate, isIsoDate, isoWeekNumber, isoWeekday, startOfWeek, weekdayLabel } from '@/lib/ops/domain/dates'
import { holidayName } from '@/lib/ops/domain/holidays'
import { absenceOn, formatMinutes } from '@/lib/ops/domain/time'
import { ABGABE_PROBLEMS, analyzeAbgabe, type AbgabeReport, type AbgabeStatus } from '@/lib/ops/domain/abgabe'
import { ABSENCE_TYPE_LABELS } from '@/lib/ops/domain/labels'
import type { Employee } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, customerName, fullName } from '@/lib/ops/utils'
import { ApproveDayButton } from './approve-day-button'

export const metadata: Metadata = { title: 'Abgabe-Check' }

const STATUS: Record<AbgabeStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ok: { label: 'Vollständig', variant: 'success' },
  luecke: { label: 'Zeit fehlt', variant: 'destructive' },
  kein_bericht: { label: 'Kein Bericht', variant: 'destructive' },
  nichts: { label: 'Nichts erfasst', variant: 'destructive' },
  keine_arbeitszeit: { label: 'Arbeitszeit fehlt', variant: 'warning' },
  entwurf: { label: 'Nicht eingereicht', variant: 'warning' },
  offen: { label: 'Heute noch offen', variant: 'muted' },
  frei: { label: 'Frei', variant: 'muted' },
  schule: { label: 'Berufsschule', variant: 'secondary' },
}

function reportsOf(entries: TimeEntryRow[]): AbgabeReport[] {
  const map = new Map<string, AbgabeReport>()
  for (const e of entries) {
    const link = e.link[0]
    if (!link?.report) continue
    const customer = e.job?.customer ? e.job.customer.short_name || customerName(e.job.customer) : 'Kunde'
    const current = map.get(link.work_report_id)
    if (current) current.minutes += e.duration_minutes
    else map.set(link.work_report_id, { id: link.work_report_id, status: link.report.status, label: `${customer}${e.job ? ` · ${e.job.title}` : ''}`, minutes: e.duration_minutes })
  }
  return [...map.values()]
}

export default async function SubmissionCheckPage({ searchParams }: { searchParams: { woche?: string } }) {
  await requireOffice()
  const supabase = createClient()
  const today = berlinToday()
  const anchor = searchParams.woche && isIsoDate(searchParams.woche) ? searchParams.woche : today
  const from = startOfWeek(anchor)
  const to = addDays(from, 6)

  const { data } = await supabase
    .from('mitarbeiter')
    .select('id, first_name, last_name, employment_role, start_date, end_date, is_active')
    .lte('start_date', to)
    .or(`end_date.is.null,end_date.gte.${from}`)
    .neq('employment_role', 'buero')
    .order('last_name')
  const employees = (data ?? []) as Pick<Employee, 'id' | 'first_name' | 'last_name' | 'employment_role' | 'start_date' | 'end_date' | 'is_active'>[]
  const ids = employees.map((e) => e.id)
  const [entries, absences, workDays] = await Promise.all([
    loadTimeEntries(supabase, { from, to, employeeIds: ids }),
    loadAbsences(supabase, { from, to, employeeIds: ids }),
    loadWorkDays(supabase, { from, to, employeeIds: ids }),
  ])

  const days = eachDay(from, to)
    .filter((d) => d <= today)
    .map((date) => {
      const rows = employees
        .filter((e) => date >= e.start_date && (!e.end_date || date <= e.end_date))
        .map((e) => {
          const dayEntries = entries.filter((x) => x.employee_id === e.id && x.entry_date === date)
          const workDay = workDays.find((w) => w.employee_id === e.id && w.work_date === date)
          const absence = absenceOn(date, absences.filter((a) => a.employee_id === e.id))
          const holiday = holidayName(date)
          const reports = reportsOf(dayEntries)
          const allocated = dayEntries.filter((x) => x.entry_type !== 'pause').reduce((n, x) => n + x.duration_minutes, 0)
          const result = analyzeAbgabe({
            presentMinutes: workDay?.duration_minutes ?? null,
            allocatedMinutes: allocated,
            reports,
            free: isoWeekday(date) > 5 || !!holiday || !!absence,
            isToday: date === today,
            school: workDay?.berufsschule,
          })
          return { employee: e, workDay, absence, holiday, reports, ...result }
        })
        .filter((r) => r.status !== 'frei' || r.absence || r.reports.length > 0)
      const submitted = new Set(entries.filter((x) => x.entry_date === date && x.link[0]?.report?.status === 'eingereicht').map((x) => x.link[0].work_report_id)).size
      return { date, rows, submitted, problems: rows.filter((r) => ABGABE_PROBLEMS.includes(r.status)).length }
    })
    .filter((d) => d.rows.length > 0 && !(isoWeekday(d.date) > 5 && d.rows.every((r) => r.reports.length === 0)))
    .reverse()

  const totalProblems = days.reduce((n, d) => n + d.problems, 0)
  const link = (date: string) => `/intern/abgabe?woche=${date}`

  return (
    <>
      <PageHeader
        title="Abgabe-Check"
        description={`KW ${isoWeekNumber(from)} · ${formatDate(from)} – ${formatDate(to)} · Wer hat Arbeitszeit und Berichte abgegeben?`}
      />
      <PageBody className="max-w-4xl">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={link(addDays(from, -7))}>
              <ChevronLeft /> Zurück
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={link(today)}>Diese Woche</Link>
          </Button>
          {addDays(from, 7) <= today ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={link(addDays(from, 7))}>
                Weiter <ChevronRight />
              </Link>
            </Button>
          ) : (
            <span className="w-20" />
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border p-4',
            totalProblems ? 'border-destructive/40 bg-destructive/5' : 'border-success/40 bg-success/5',
          )}
        >
          {totalProblems ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Check className="h-5 w-5 text-success" />}
          <div className="font-medium">
            {totalProblems ? `${totalProblems} ${totalProblems === 1 ? 'Punkt ist' : 'Punkte sind'} noch offen` : 'Alles vollständig abgegeben'}
          </div>
        </div>

        {days.length === 0 ? <p className="text-sm text-muted-foreground">Für diese Woche gibt es noch keine Einträge.</p> : null}

        {days.map((day) => (
          <section key={day.date} className="overflow-hidden rounded-xl border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
              <div>
                <h2 className="font-semibold">
                  {weekdayLabel(day.date, true)}, {formatDate(day.date).slice(0, 6)}
                  {day.date === today ? <span className="ml-2 text-xs font-normal text-primary">heute</span> : null}
                </h2>
                <p className={cn('text-xs', day.problems ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                  {day.problems ? `${day.problems} offen` : 'alles in Ordnung'}
                </p>
              </div>
              {day.submitted > 0 ? <ApproveDayButton date={day.date} count={day.submitted} /> : null}
            </header>
            <ul className="divide-y">
              {day.rows.map((r) => (
                <li key={r.employee.id} className={cn('grid gap-2 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start', ABGABE_PROBLEMS.includes(r.status) && 'bg-destructive/5')}>
                  <div>
                    <Link href={`/intern/zeiten?mitarbeiter=${r.employee.id}&datum=${day.date}`} className="font-medium hover:underline">
                      {fullName(r.employee)}
                    </Link>
                    <div className="tabular flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {r.workDay ? `${r.workDay.start_time.slice(0, 5)}–${r.workDay.end_time.slice(0, 5)} · ${formatMinutes(r.workDay.duration_minutes)}` : 'keine Arbeitszeit'}
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1 text-sm">
                    {r.absence ? <div className="text-muted-foreground">{ABSENCE_TYPE_LABELS[r.absence.absence_type]}</div> : null}
                    {r.reports.map((rep) => (
                      <Link key={rep.id} href={`/intern/berichte/${rep.id}`} className="flex items-center justify-between gap-2 hover:underline">
                        <span className="truncate">{rep.label}</span>
                        <span className="tabular shrink-0 text-xs text-muted-foreground">{formatMinutes(rep.minutes)}</span>
                      </Link>
                    ))}
                    {!r.reports.length && !r.absence && r.status !== 'schule' ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="h-3 w-3" /> kein Bericht
                      </div>
                    ) : null}
                    {r.status === 'luecke' ? <div className="text-xs font-medium text-destructive">{formatMinutes(r.gapMinutes)} sind keinem Bericht zugeordnet</div> : null}
                  </div>
                  <div className="sm:text-right">
                    <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-xs text-muted-foreground">
          „Vollständig“ heißt: Die Arbeitszeit (Beginn–Ende) ist auf Berichte oder Fahr-/Lagerzeiten verteilt (bis 15 Minuten Toleranz) und alle Berichte sind eingereicht.
        </p>
      </PageBody>
    </>
  )
}
