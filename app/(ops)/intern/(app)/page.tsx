import Link from 'next/link'
import { ArrowRight, CalendarDays, ClipboardCheck, FileWarning, Plus, Receipt, TimerOff, Wrench } from 'lucide-react'
import { requireSession, type SessionContext } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory, loadJobOptions } from '@/lib/ops/data/common'
import { loadReports } from '@/lib/ops/data/reports'
import { buildDays, loadAbsences, loadTimeEntries, loadWorkDays } from '@/lib/ops/data/time'
import { WorkDayCard } from '@/components/ops/work-day-card'
import { defaultScheduleFor } from '@/lib/ops/domain/workday'
import { isRegularWorkday } from '@/lib/ops/domain/time'
import { addDays, berlinToday, formatDateLong, formatDateShort, startOfWeek } from '@/lib/ops/domain/dates'
import { PageBody, PageHeader, EmptyState } from '@/components/ops/page-header'
import { ReportList } from '@/components/ops/report-list'
import { FlagList, SummaryTiles } from '@/components/ops/time-views'
import { JobStatusBadge } from '@/components/ops/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Employee, JobStatus } from '@/lib/ops/domain/types'
import { customerName, formatJobNumber, fullName } from '@/lib/ops/utils'

export default async function HomePage() {
  const ctx = await requireSession()
  return ctx.isOffice ? <OfficeDashboard ctx={ctx} /> : <EmployeeToday ctx={ctx} />
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Berlin' })
      .formatToParts(new Date())
      .find((p) => p.type === 'hour')?.value ?? 12,
  )
  return hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend'
}

async function EmployeeToday({ ctx }: { ctx: SessionContext }) {
  const supabase = createClient()
  const today = berlinToday()
  const employeeId = ctx.employee?.id
  const weekAgo = addDays(today, -7)
  const [directory, jobs, myReports, entries, absences, workDays] = await Promise.all([
    loadDirectory(supabase),
    loadJobOptions(supabase),
    loadReports(supabase, { employeeId, from: addDays(today, -30), limit: 50 }),
    employeeId ? loadTimeEntries(supabase, { from: weekAgo, to: today, employeeIds: [employeeId] }) : Promise.resolve([]),
    employeeId ? loadAbsences(supabase, { from: weekAgo, to: today, employeeIds: [employeeId] }) : Promise.resolve([]),
    employeeId ? loadWorkDays(supabase, { from: weekAgo, to: today, employeeIds: [employeeId] }) : Promise.resolve([]),
  ])
  const week = buildDays({ from: weekAgo, to: today, today, entries, absences, workDays })
  const day = week[week.length - 1]
  const missingDays = week.filter((d) => d.flags.some((f) => f.code === 'MISSING' || f.code === 'WORKDAY_MISSING'))
  const open = myReports.filter((r) => r.status === 'entwurf' || r.status === 'korrektur_erforderlich')
  const activeJobs = jobs.filter((j) => ['geplant', 'in_bearbeitung'].includes(j.status)).slice(0, 8)
  const firstName = ctx.employee?.first_name ?? ctx.profile.display_name.split(' ')[0]

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName}`} description={formatDateLong(today)} />
      <PageBody className="max-w-3xl">
        <Button asChild size="xl" className="w-full shadow-md">
          <Link href="/intern/berichte/neu">
            <Plus className="!size-5" /> Neuer Arbeitsbericht
          </Link>
        </Button>

        {employeeId && !day.absence && isRegularWorkday(today) ? (
          <WorkDayCard
            key={day.workDay?.id ?? 'neu'}
            employeeId={employeeId}
            date={today}
            workDay={day.workDay}
            defaults={defaultScheduleFor(today)}
            title="Arbeitszeit heute"
          />
        ) : null}

        {missingDays.length ? (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
            <span className="font-medium text-warning">Arbeitszeit fehlt: </span>
            {missingDays.map((d, i) => (
              <span key={d.date}>
                {i ? ', ' : ''}
                <Link href={`/intern/zeiten?datum=${d.date}`} className="underline underline-offset-2">
                  {formatDateShort(d.date)}
                </Link>
              </span>
            ))}
          </div>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Heute erfasst</h2>
            <Link href="/intern/zeiten" className="text-sm text-primary">
              Meine Zeiten
            </Link>
          </div>
          <SummaryTiles totals={day.totals} />
          <FlagList flags={day.flags.filter((f) => f.code !== 'MISSING' && f.code !== 'WORKDAY_MISSING')} />
        </section>

        {open.length ? (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileWarning className="h-4 w-4" /> Offene Berichte
            </h2>
            <ReportList reports={open} directory={directory} compact />
          </section>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Meine Aufträge</h2>
          {activeJobs.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {activeJobs.map((j) => (
                <li key={j.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/intern/auftraege/${j.id}`} className="min-w-0 flex-1">
                    <div className="truncate font-medium">{j.customer ? customerName(j.customer) : '—'}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {j.title}
                      {j.location ? ` · ${j.location.city}` : ''}
                    </div>
                  </Link>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/intern/berichte/neu?auftrag=${j.id}`}>
                      <Plus /> Bericht
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Keine offenen Aufträge" description="Neue Aufträge können direkt im Arbeitsbericht angelegt werden." />
          )}
        </section>

        {myReports.filter((r) => r.status !== 'entwurf' && r.status !== 'korrektur_erforderlich').length ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Zuletzt eingereicht</h2>
              <Link href="/intern/berichte" className="text-sm text-primary">
                Alle
              </Link>
            </div>
            <ReportList
              reports={myReports.filter((r) => r.status !== 'entwurf' && r.status !== 'korrektur_erforderlich').slice(0, 5)}
              directory={directory}
              compact
            />
          </section>
        ) : null}
      </PageBody>
    </>
  )
}

async function OfficeDashboard({ ctx }: { ctx: SessionContext }) {
  const supabase = createClient()
  const today = berlinToday()
  const weekStart = startOfWeek(today)
  const yesterday = addDays(today, -1)
  const missingFrom = weekStart < yesterday ? weekStart : addDays(weekStart, -7)

  const [directory, submitted, corrections, recent, jobsRes, employeesRes] = await Promise.all([
    loadDirectory(supabase),
    loadReports(supabase, { status: 'eingereicht', limit: 50 }),
    loadReports(supabase, { status: 'korrektur_erforderlich', limit: 50 }),
    loadReports(supabase, { from: addDays(today, -14), limit: 8 }),
    supabase
      .from('auftraege')
      .select('id, job_number, title, status, completion_date, customer:kunden(first_name, last_name, company_name)')
      .is('archived_at', null)
      .in('status', ['abgeschlossen', 'abrechnungsbereit'])
      .order('completion_date', { ascending: true, nullsFirst: false })
      .limit(50),
    supabase.from('mitarbeiter').select('id, first_name, last_name, start_date, end_date, employment_role').eq('is_active', true),
  ])
  const employees = (employeesRes.data ?? []) as Employee[]
  const [entries, absences, workDays] = await Promise.all([
    loadTimeEntries(supabase, { from: missingFrom, to: yesterday, employeeIds: employees.map((e) => e.id) }),
    loadAbsences(supabase, { from: missingFrom, to: yesterday, employeeIds: employees.map((e) => e.id) }),
    loadWorkDays(supabase, { from: missingFrom, to: yesterday, employeeIds: employees.map((e) => e.id) }),
  ])
  const missing = employees
    .map((e) => ({
      employee: e,
      days: buildDays({
        from: missingFrom,
        to: yesterday,
        today,
        entries: entries.filter((x) => x.employee_id === e.id),
        absences: absences.filter((a) => a.employee_id === e.id),
        workDays: workDays.filter((w) => w.employee_id === e.id),
        employment: e,
      }).filter((d) => d.flags.some((f) => ['MISSING', 'WORKDAY_MISSING', 'OVERLAP'].includes(f.code))),
    }))
    .filter((m) => m.days.length)

  type DashJob = { id: string; job_number: number; title: string; status: JobStatus; customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null }
  const jobs = (jobsRes.data ?? []) as unknown as DashJob[]
  const ready = jobs.filter((j) => j.status === 'abrechnungsbereit')
  const completed = jobs.filter((j) => j.status === 'abgeschlossen')

  const kpis = [
    { label: 'Zur Prüfung', value: submitted.length, href: '/intern/berichte?status=eingereicht', icon: ClipboardCheck, tone: 'text-primary' },
    { label: 'Korrektur angefordert', value: corrections.length, href: '/intern/berichte?status=korrektur_erforderlich', icon: FileWarning, tone: 'text-warning' },
    { label: 'Abrechnungsbereit', value: ready.length, href: '/intern/auftraege?status=abrechnungsbereit', icon: Receipt, tone: 'text-success' },
    { label: 'Fehlende Zeiten', value: missing.reduce((n, m) => n + m.days.length, 0), href: '/intern/abgabe', icon: TimerOff, tone: 'text-destructive' },
  ]

  return (
    <>
      <PageHeader
        title="Übersicht"
        description={`${greeting()}, ${ctx.profile.display_name.split(' ')[0] || 'Büro'} · ${formatDateLong(today)}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/intern/kalender">
              <CalendarDays /> Kalender
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
              <k.icon className={`h-5 w-5 ${k.tone}`} />
              <div className="tabular mt-3 text-2xl font-semibold">{k.value}</div>
              <div className="text-sm text-muted-foreground">{k.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <section className="space-y-2">
              <SectionTitle title="Warten auf Freigabe" href="/intern/berichte?status=eingereicht" />
              {submitted.length ? (
                <ReportList reports={submitted.slice(0, 10)} directory={directory} />
              ) : (
                <EmptyState title="Alles geprüft" description="Keine eingereichten Berichte offen." />
              )}
            </section>
            <section className="space-y-2">
              <SectionTitle title="Zuletzt erfasst" href="/intern/berichte" />
              {recent.length ? <ReportList reports={recent} directory={directory} /> : <EmptyState title="Noch keine Berichte" />}
            </section>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Abrechnungsbereit</CardTitle>
                <Receipt className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <JobMiniList jobs={ready} empty="Keine Aufträge zur Abrechnung." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Abgeschlossen</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <JobMiniList jobs={completed} empty="Keine abgeschlossenen Aufträge offen." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Fehlende Zeiten</CardTitle>
                <TimerOff className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {missing.length ? (
                  <ul className="space-y-2 text-sm">
                    {missing.map((m) => (
                      <li key={m.employee.id}>
                        <Link href={`/intern/zeiten?mitarbeiter=${m.employee.id}&datum=${m.days[0].date}`} className="font-medium hover:underline">
                          {fullName(m.employee)}
                        </Link>
                        <div className="text-xs text-muted-foreground">{m.days.map((d) => formatDateShort(d.date)).join(', ')}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Alle Werktage erfasst.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm text-primary">
        Alle <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function JobMiniList({
  jobs,
  empty,
}: {
  jobs: { id: string; job_number: number; title: string; status: JobStatus; customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null }[]
  empty: string
}) {
  if (!jobs.length) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="-mx-2 space-y-1">
      {jobs.slice(0, 8).map((j) => (
        <li key={j.id}>
          <Link href={`/intern/auftraege/${j.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{j.customer ? customerName(j.customer) : '—'}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {j.title} · {formatJobNumber(j.job_number)}
              </span>
            </span>
            <JobStatusBadge status={j.status} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
