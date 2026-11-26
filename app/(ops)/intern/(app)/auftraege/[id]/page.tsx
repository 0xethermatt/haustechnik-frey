import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadReports } from '@/lib/ops/data/reports'
import { formatDate } from '@/lib/ops/domain/dates'
import { formatMinutes, summarizeEntries } from '@/lib/ops/domain/time'
import { JOB_CATEGORY_LABELS } from '@/lib/ops/domain/labels'
import type { JobCategory, JobStatus, TimeEntryType } from '@/lib/ops/domain/types'
import { EmptyState, PageBody, PageHeader } from '@/components/ops/page-header'
import { JobStatusBadge } from '@/components/ops/status-badges'
import { ReportList } from '@/components/ops/report-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerName, formatAddress, formatJobNumber, formatQuantity } from '@/lib/ops/utils'
import { ArchiveJobButton, JobStatusControl } from './job-status-control'

export const metadata: Metadata = { title: 'Auftrag' }

export default async function JobPage({ params }: { params: { id: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const { data: job } = await supabase
    .from('auftraege')
    .select(
      '*, customer:kunden(id, first_name, last_name, company_name, phone), location:einsatzorte(street, postal_code, city, label, access_notes), assignments:auftragszuweisungen(employee_id)',
    )
    .eq('id', params.id)
    .maybeSingle()
  if (!job) notFound()

  const [directory, reports, { data: entries }, { data: materials }] = await Promise.all([
    loadDirectory(supabase),
    loadReports(supabase, { jobId: job.id, limit: 500 }),
    supabase
      .from('zeiteintraege')
      .select('id, employee_id, entry_date, entry_type, started_at, ended_at, break_minutes, duration_minutes, billable')
      .eq('job_id', job.id),
    supabase
      .from('arbeitsbericht_material')
      .select('description, quantity, unit, article_number, report:arbeitsberichte!inner(job_id, status)')
      .eq('report.job_id', job.id),
  ])

  const timeEntries = (entries ?? []) as {
    id: string
    employee_id: string
    entry_date: string
    entry_type: TimeEntryType
    started_at: string | null
    ended_at: string | null
    break_minutes: number
    duration_minutes: number
    billable: boolean
  }[]
  const total = summarizeEntries(timeEntries)
  const perEmployee = [...new Set(timeEntries.map((e) => e.employee_id))]
    .map((id) => ({ id, minutes: summarizeEntries(timeEntries.filter((e) => e.employee_id === id)).workMinutes }))
    .sort((a, b) => b.minutes - a.minutes)

  // Materialsumme je Bezeichnung/Einheit – hilfreich für die Rechnungsstellung in Edison
  const materialTotals = new Map<string, { description: string; unit: string; quantity: number; article_number: string | null; approvedOnly: boolean }>()
  for (const m of (materials ?? []) as unknown as { description: string; quantity: number; unit: string; article_number: string | null; report: { status: string } }[]) {
    const key = `${m.description.toLowerCase()}|${m.unit}|${m.article_number ?? ''}`
    const current = materialTotals.get(key) ?? { description: m.description, unit: m.unit, quantity: 0, article_number: m.article_number, approvedOnly: true }
    current.quantity += Number(m.quantity)
    if (m.report.status !== 'freigegeben') current.approvedOnly = false
    materialTotals.set(key, current)
  }
  const openReports = reports.filter((r) => r.status !== 'freigegeben').length
  const customer = job.customer as { id: string; first_name: string | null; last_name: string | null; company_name: string | null; phone: string | null } | null
  const location = job.location as { street: string; postal_code: string; city: string; label: string | null; access_notes: string | null } | null
  const assignments = (job.assignments ?? []) as { employee_id: string }[]

  return (
    <>
      <PageHeader
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status as JobStatus} />
            {formatJobNumber(job.job_number)} · {JOB_CATEGORY_LABELS[job.category as JobCategory]}
          </span>
        }
        back={{ href: '/intern/auftraege', label: 'Aufträge' }}
        actions={
          <>
            {job.status !== 'abgerechnet' && !job.archived_at ? (
              <Button asChild>
                <Link href={`/intern/berichte/neu?auftrag=${job.id}`}>
                  <Plus /> Bericht
                </Link>
              </Button>
            ) : null}
            {ctx.isOffice ? (
              <Button asChild variant="outline">
                <Link href={`/intern/auftraege/${job.id}/bearbeiten`}>
                  <Pencil /> Bearbeiten
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <PageBody>
        {ctx.isOffice ? (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Status</CardTitle>
              <ArchiveJobButton jobId={job.id} archived={!!job.archived_at} />
            </CardHeader>
            <CardContent>
              <JobStatusControl jobId={job.id} status={job.status as JobStatus} openReports={openReports} />
              {openReports ? (
                <p className="mt-2 text-xs text-muted-foreground">{openReports} Bericht(e) noch nicht freigegeben.</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kunde & Einsatzort</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {customer ? (
                  <Link href={`/intern/kunden/${customer.id}`} className="block font-medium hover:underline">
                    {customerName(customer)}
                  </Link>
                ) : null}
                {customer?.phone ? (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" /> {customer.phone}
                  </a>
                ) : null}
                {location ? (
                  <div className="flex gap-2 pt-1">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      {location.label ? <div className="font-medium">{location.label}</div> : null}
                      {formatAddress(location)}
                      {location.access_notes ? <div className="text-xs text-muted-foreground">{location.access_notes}</div> : null}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Beginn" value={formatDate(job.start_date)} />
                <Row label="Fertigstellung" value={job.completion_date ? formatDate(job.completion_date) : '—'} />
                <Row
                  label="Mitarbeiter"
                  value={assignments.length ? assignments.map((a) => directory.name(a.employee_id)).join(', ') : '—'}
                />
                {job.description ? <p className="whitespace-pre-wrap pt-2">{job.description}</p> : null}
                {job.notes ? (
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground">Interne Notizen</div>
                    <p className="whitespace-pre-wrap">{job.notes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Stunden</CardTitle>
                <span className="tabular text-sm font-semibold">{formatMinutes(total.workMinutes)}</span>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Verrechenbar" value={formatMinutes(total.billableMinutes)} />
                <Row label="Nicht verrechenbar" value={formatMinutes(total.nonBillableMinutes)} />
                <div className="border-t pt-2">
                  {perEmployee.map((p) => (
                    <Row key={p.id} label={directory.name(p.id)} value={formatMinutes(p.minutes)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Arbeitsberichte ({reports.length})</h2>
              {reports.length ? <ReportList reports={reports} directory={directory} /> : <EmptyState title="Noch keine Berichte" />}
            </section>
            {materialTotals.size ? (
              <Card>
                <CardHeader>
                  <CardTitle>Material gesamt</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y text-sm">
                    {[...materialTotals.values()].map((m) => (
                      <li key={`${m.description}-${m.unit}-${m.article_number}`} className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <span>
                          {m.description}
                          {m.article_number ? <span className="text-xs text-muted-foreground"> · {m.article_number}</span> : null}
                          {!m.approvedOnly ? <span className="text-xs text-warning"> · nicht alles freigegeben</span> : null}
                        </span>
                        <span className="tabular shrink-0 font-medium">
                          {formatQuantity(m.quantity)} {m.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular text-right">{value}</span>
    </div>
  )
}
