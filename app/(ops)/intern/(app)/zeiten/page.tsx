import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight, FileText, Pencil } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory, loadJobOptions } from '@/lib/ops/data/common'
import { buildDays, loadAbsences, loadTimeEntries } from '@/lib/ops/data/time'
import { addDays, berlinToday, formatDateLong, isIsoDate, isoWeekNumber, startOfWeek, utcToBerlinTime } from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { ABSENCE_TYPE_LABELS, TIME_ENTRY_TYPE_LABELS } from '@/lib/ops/domain/labels'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { FlagList, SummaryTiles, WeekStrip } from '@/components/ops/time-views'
import { TimeEntrySheet } from '@/components/ops/time-entry-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/select'
import { customerName, formatJobNumber, formatReportNumber, fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Zeiten' }

export default async function TimePage({ searchParams }: { searchParams: { datum?: string; mitarbeiter?: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const today = berlinToday()
  const date = searchParams.datum && isIsoDate(searchParams.datum) && searchParams.datum <= today ? searchParams.datum : today

  const directory = await loadDirectory(supabase)
  let employeeId = ctx.employee?.id ?? null
  if (ctx.isOffice && searchParams.mitarbeiter && directory.list.some((e) => e.id === searchParams.mitarbeiter)) {
    employeeId = searchParams.mitarbeiter
  }
  if (!employeeId) redirect('/intern/zeiten/uebersicht')

  const weekStart = startOfWeek(date)
  const weekEnd = addDays(weekStart, 6)
  const [entries, absences, jobs, employment] = await Promise.all([
    loadTimeEntries(supabase, { from: weekStart, to: weekEnd, employeeIds: [employeeId] }),
    loadAbsences(supabase, { from: weekStart, to: weekEnd, employeeIds: [employeeId] }),
    loadJobOptions(supabase),
    supabase.from('employees').select('start_date, end_date').eq('id', employeeId).maybeSingle(),
  ])
  const days = buildDays({ from: weekStart, to: weekEnd, today, entries, absences, employment: employment.data ?? undefined })
  const day = days.find((d) => d.date === date)!
  const isOwn = employeeId === ctx.employee?.id
  const canAdd = isOwn || ctx.isOffice

  const href = (d: string) => {
    const p = new URLSearchParams()
    if (d !== today) p.set('datum', d)
    if (!isOwn) p.set('mitarbeiter', employeeId!)
    const s = p.toString()
    return s ? `/intern/zeiten?${s}` : '/intern/zeiten'
  }
  const jobOptions = jobs.map((j) => ({
    id: j.id,
    label: `${j.customer ? customerName(j.customer) : ''} – ${j.title} (${formatJobNumber(j.job_number)})`,
  }))

  return (
    <>
      <PageHeader
        title={isOwn ? 'Meine Zeiten' : `Zeiten ${directory.name(employeeId)}`}
        description={`KW ${isoWeekNumber(date)} · ${formatDateLong(date)}`}
        back={!isOwn ? { href: '/intern/zeiten/uebersicht', label: 'Zeitübersicht' } : undefined}
      />
      <PageBody className="max-w-3xl">
        {ctx.isOffice ? (
          <form method="get" className="flex gap-2">
            <input type="hidden" name="datum" value={date} />
            <div className="flex-1">
              <NativeSelect name="mitarbeiter" defaultValue={employeeId} aria-label="Mitarbeiter">
                {directory.active.map((e) => (
                  <option key={e.id} value={e.id}>
                    {fullName(e)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" variant="secondary">
              Anzeigen
            </Button>
          </form>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={href(addDays(weekStart, -7))}>
              <ChevronLeft /> Vorwoche
            </Link>
          </Button>
          {date !== today ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={href(today)}>Heute</Link>
            </Button>
          ) : null}
          {addDays(weekStart, 7) <= today ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={href(addDays(weekStart, 7))}>
                Nächste <ChevronRight />
              </Link>
            </Button>
          ) : (
            <span className="w-24" />
          )}
        </div>
        <WeekStrip days={days} selected={date} hrefFor={href} />

        <SummaryTiles summary={day.summary} />

        {day.holiday ? <Badge variant="secondary">Feiertag: {day.holiday}</Badge> : null}
        {day.absence ? (
          <Badge variant="secondary">
            {ABSENCE_TYPE_LABELS[day.absence.absence_type]}
            {day.absence.half_day ? ' (halber Tag)' : ''}
          </Badge>
        ) : null}
        <FlagList flags={day.flags} />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Einträge</h2>
          {day.entries.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {day.entries.map((e) => {
                const link = e.link[0]
                const span = e.started_at && e.ended_at ? `${utcToBerlinTime(e.started_at)}–${utcToBerlinTime(e.ended_at)}` : null
                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {TIME_ENTRY_TYPE_LABELS[e.entry_type]}
                        {e.billable ? <Badge variant="success">verrechenbar</Badge> : null}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {[span, e.job ? `${e.job.customer ? customerName(e.job.customer) : ''} – ${e.job.title}` : null, e.note]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="tabular font-semibold">{formatMinutes(e.duration_minutes)}</div>
                      {e.break_minutes ? <div className="text-xs text-muted-foreground">+{e.break_minutes} min Pause</div> : null}
                    </div>
                  </>
                )
                return (
                  <li key={e.id}>
                    {link ? (
                      <Link href={`/intern/berichte/${link.work_report_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        {content}
                        {link.report ? <span className="sr-only">Bericht {formatReportNumber(link.report.report_number)}</span> : null}
                      </Link>
                    ) : canAdd ? (
                      <TimeEntrySheet
                        employeeId={employeeId!}
                        date={date}
                        jobs={jobOptions}
                        entry={{
                          id: e.id,
                          entry_type: e.entry_type,
                          job_id: e.job_id,
                          useSpan: !!span,
                          start_time: e.started_at ? utcToBerlinTime(e.started_at) : '',
                          end_time: e.ended_at ? utcToBerlinTime(e.ended_at) : '',
                          break_minutes: e.break_minutes,
                          duration_minutes: e.duration_minutes,
                          billable: e.billable,
                          note: e.note ?? '',
                        }}
                        triggerClassName="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                      >
                        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {content}
                      </TimeEntrySheet>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed bg-card p-4 text-center text-sm text-muted-foreground">Noch keine Zeiten für diesen Tag.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Einträge mit <FileText className="inline h-3 w-3 text-primary" /> stammen aus Arbeitsberichten und werden dort geändert.
          </p>
        </section>

        {canAdd ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <TimeEntrySheet employeeId={employeeId} date={date} jobs={jobOptions} />
            {isOwn ? (
              <Button asChild>
                <Link href="/intern/berichte/neu">
                  <FileText /> Arbeitsbericht erfassen
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </PageBody>
    </>
  )
}
