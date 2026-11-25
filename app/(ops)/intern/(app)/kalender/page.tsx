import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadReports, reportMinutes, type ReportListItem } from '@/lib/ops/data/reports'
import { loadAbsences, loadTimeEntries, loadWorkDays } from '@/lib/ops/data/time'
import {
  addDays,
  berlinToday,
  eachDay,
  formatDate,
  formatDateLong,
  isIsoDate,
  isoWeekNumber,
  startOfWeek,
  weekdayLabel,
} from '@/lib/ops/domain/dates'
import { holidayName } from '@/lib/ops/domain/holidays'
import { dayTotals, formatMinutes } from '@/lib/ops/domain/time'
import { ABSENCE_TYPE_LABELS, REPORT_STATUS_LABELS } from '@/lib/ops/domain/labels'
import type { ReportStatus } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { ReportList } from '@/components/ops/report-list'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/select'
import { cn, customerName, fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Kalender' }

const STATUS_STRIPE: Record<ReportStatus, string> = {
  entwurf: 'border-l-muted-foreground/40',
  eingereicht: 'border-l-primary',
  freigegeben: 'border-l-success',
  korrektur_erforderlich: 'border-l-warning',
}

export default async function CalendarPage({ searchParams }: { searchParams: { ansicht?: string; datum?: string; mitarbeiter?: string; status?: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const today = berlinToday()
  const view = searchParams.ansicht === 'tag' ? 'tag' : 'woche'
  const date = searchParams.datum && isIsoDate(searchParams.datum) ? searchParams.datum : today
  const from = view === 'woche' ? startOfWeek(date) : date
  const to = view === 'woche' ? addDays(from, 6) : date
  const directory = await loadDirectory(supabase)
  const employeeId = searchParams.mitarbeiter && directory.list.some((e) => e.id === searchParams.mitarbeiter) ? searchParams.mitarbeiter : undefined
  const status = Object.keys(REPORT_STATUS_LABELS).includes(searchParams.status ?? '') ? (searchParams.status as ReportStatus) : undefined

  const [reports, absences, dayEntries, dayWorkDays] = await Promise.all([
    loadReports(supabase, { from, to, employeeId, status, limit: 500 }),
    loadAbsences(supabase, { from, to, employeeIds: employeeId ? [employeeId] : undefined }),
    view === 'tag' && ctx.isOffice
      ? loadTimeEntries(supabase, { from, to, employeeIds: employeeId ? [employeeId] : undefined })
      : Promise.resolve([]),
    view === 'tag' && ctx.isOffice
      ? loadWorkDays(supabase, { from, to, employeeIds: employeeId ? [employeeId] : undefined })
      : Promise.resolve([]),
  ])

  const href = (patch: Record<string, string | undefined>) => {
    const merged = { ansicht: view, datum: date, mitarbeiter: employeeId, status, ...patch }
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    return `/intern/kalender?${p}`
  }
  const step = view === 'woche' ? 7 : 1
  const byDay = (d: string) => reports.filter((r) => r.report_date === d)
  const absencesOn = (d: string) => absences.filter((a) => a.start_date <= d && d <= a.end_date)

  return (
    <>
      <PageHeader
        title="Kalender"
        description={view === 'woche' ? `KW ${isoWeekNumber(from)} · ${formatDate(from)} – ${formatDate(to)}` : formatDateLong(date)}
        actions={
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['woche', 'tag'] as const).map((v) => (
              <Link
                key={v}
                href={href({ ansicht: v })}
                className={cn('rounded-md px-4 py-1.5 text-sm text-muted-foreground', view === v && 'bg-background font-medium text-foreground shadow-sm')}
              >
                {v === 'woche' ? 'Woche' : 'Tag'}
              </Link>
            ))}
          </div>
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Zurück">
            <Link href={href({ datum: addDays(date, -step) })}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={href({ datum: today })}>Heute</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Weiter">
            <Link href={href({ datum: addDays(date, step) })}>
              <ChevronRight />
            </Link>
          </Button>
          <form method="get" className="ml-auto flex flex-1 flex-wrap gap-2 sm:flex-none">
            <input type="hidden" name="ansicht" value={view} />
            <input type="hidden" name="datum" value={date} />
            {ctx.isOffice ? (
              <div className="min-w-[10rem] flex-1">
                <NativeSelect name="mitarbeiter" defaultValue={employeeId ?? ''} aria-label="Mitarbeiter">
                  <option value="">Alle Mitarbeiter</option>
                  {directory.list.map((e) => (
                    <option key={e.id} value={e.id}>
                      {fullName(e)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
            <div className="min-w-[10rem] flex-1">
              <NativeSelect name="status" defaultValue={status ?? ''} aria-label="Status">
                <option value="">Alle Status</option>
                {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {REPORT_STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" variant="secondary">
              Filtern
            </Button>
          </form>
        </div>

        {view === 'woche' ? (
          <div className="grid gap-2 md:grid-cols-7">
            {eachDay(from, to).map((d) => {
              const dayReports = byDay(d)
              const holiday = holidayName(d)
              const dayAbsences = absencesOn(d)
              return (
                <div key={d} className={cn('flex min-h-[8rem] flex-col rounded-xl border bg-card', d === today && 'border-primary')}>
                  <Link href={href({ ansicht: 'tag', datum: d })} className="flex items-baseline justify-between border-b px-3 py-2 hover:bg-accent/50">
                    <span className={cn('text-sm font-medium', d === today && 'text-primary')}>
                      {weekdayLabel(d)} {formatDate(d).slice(0, 6)}
                    </span>
                    {dayReports.length ? (
                      <span className="tabular text-xs text-muted-foreground">
                        {formatMinutes(dayReports.reduce((s, r) => s + reportMinutes(r), 0), false)} h
                      </span>
                    ) : null}
                  </Link>
                  <div className="flex-1 space-y-1.5 p-2">
                    {holiday ? <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{holiday}</div> : null}
                    {dayAbsences.map((a) => (
                      <div key={a.id} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {directory.name(a.employee_id).split(' ')[0]}: {ABSENCE_TYPE_LABELS[a.absence_type]}
                      </div>
                    ))}
                    {dayReports.map((r) => (
                      <CalendarReport key={r.id} report={r} names={r.time_links.map((l) => directory.name(l.employee_id).split(' ')[0])} />
                    ))}
                    {!dayReports.length && !holiday && !dayAbsences.length ? (
                      <p className="px-1 text-xs text-muted-foreground/70">Keine Berichte</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-2">
              {holidayName(date) ? <p className="text-sm text-muted-foreground">Feiertag: {holidayName(date)}</p> : null}
              {reports.length ? (
                <ReportList reports={reports} directory={directory} />
              ) : (
                <div className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                  Keine Berichte an diesem Tag.
                  {date <= today ? (
                    <div className="mt-3">
                      <Button asChild size="sm">
                        <Link href="/intern/berichte/neu">
                          <Plus /> Bericht erfassen
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {ctx.isOffice ? (
              <div className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Stunden an diesem Tag</h2>
                <ul className="space-y-2 text-sm">
                  {directory.active
                    .filter((e) => !employeeId || e.id === employeeId)
                    .map((e) => {
                      const wd = dayWorkDays.find((w) => w.employee_id === e.id)
                      const s = dayTotals(dayEntries.filter((x) => x.employee_id === e.id), wd)
                      const absence = absencesOn(date).find((a) => a.employee_id === e.id)
                      return (
                        <li key={e.id} className="flex items-center justify-between gap-2">
                          <Link href={`/intern/zeiten?mitarbeiter=${e.id}&datum=${date}`} className="hover:underline">
                            {fullName(e)}
                          </Link>
                          <span className="tabular text-muted-foreground">
                            {s.workMinutes ? (
                              <>
                                {wd ? `${wd.start_time.slice(0, 5)}–${wd.end_time.slice(0, 5)} · ` : ''}
                                <span className="font-medium text-foreground">{formatMinutes(s.workMinutes)}</span> · {formatMinutes(s.billableMinutes, false)} verr.
                              </>
                            ) : absence ? (
                              ABSENCE_TYPE_LABELS[absence.absence_type]
                            ) : (
                              '–'
                            )}
                          </span>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(Object.keys(STATUS_STRIPE) as ReportStatus[]).map((s) => (
            <span key={s} className={cn('border-l-4 pl-1.5', STATUS_STRIPE[s])}>
              {REPORT_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </PageBody>
    </>
  )
}

function CalendarReport({ report, names }: { report: ReportListItem; names: string[] }) {
  return (
    <Link
      href={`/intern/berichte/${report.id}`}
      className={cn('block rounded-md border border-l-4 bg-background px-2 py-1.5 text-xs hover:bg-accent/50', STATUS_STRIPE[report.status])}
    >
      <div className="truncate font-medium">{report.job?.customer ? customerName(report.job.customer) : '—'}</div>
      <div className="truncate text-muted-foreground">{report.job?.title}</div>
      <div className="tabular mt-0.5 truncate text-muted-foreground">
        {formatMinutes(reportMinutes(report), false)} h · {names.join(', ')}
      </div>
    </Link>
  )
}
