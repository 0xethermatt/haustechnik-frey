import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, MapPin, Pencil, Phone } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadReportDetail } from '@/lib/ops/data/reports'
import { summarizeReportAudit, type AuditRow } from '@/lib/ops/domain/audit'
import { formatDateLong, formatDateTime, utcToBerlinTime } from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { ReportStatusBadge } from '@/components/ops/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerName, formatAddress, formatJobNumber, formatQuantity, formatReportNumber } from '@/lib/ops/utils'
import { ReviewPanel } from './review-panel'

export const metadata: Metadata = { title: 'Arbeitsbericht' }

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const [report, directory] = await Promise.all([loadReportDetail(supabase, params.id), loadDirectory(supabase)])
  if (!report) notFound()

  const totalMinutes = report.time_links.reduce((s, l) => s + (l.time_entry?.duration_minutes ?? 0), 0)
  const canEdit = ctx.isOffice || (report.created_by === ctx.userId && ['entwurf', 'korrektur_erforderlich'].includes(report.status))
  const activities = [...report.activities].sort((a, b) => a.position - b.position)
  const materials = [...report.materials].sort((a, b) => a.position - b.position)

  let history: ReturnType<typeof summarizeReportAudit> = []
  if (ctx.isOffice) {
    const { data: links } = await supabase.from('arbeitsbericht_zeiteintraege').select('time_entry_id').eq('work_report_id', report.id)
    const entryIds = (links ?? []).map((l) => l.time_entry_id)
    const filters = [
      `record_id.eq.${report.id}`,
      `new_data->>work_report_id.eq.${report.id}`,
      `old_data->>work_report_id.eq.${report.id}`,
      ...(entryIds.length ? [`record_id.in.(${entryIds.join(',')})`] : []),
    ]
    const { data: audit } = await supabase
      .from('aenderungsprotokoll')
      .select('id, table_name, record_id, action, actor_id, reason, old_data, new_data, changed_at')
      .in('table_name', ['arbeitsberichte', 'zeiteintraege', 'arbeitsbericht_material', 'arbeitsbericht_taetigkeiten'])
      .or(filters.join(','))
      .order('changed_at', { ascending: false })
      .limit(100)
    history = summarizeReportAudit((audit ?? []) as AuditRow[], directory.name)
  }

  const creator = directory.profileName(report.created_by) ?? (report.created_by === ctx.userId ? 'Ihnen' : 'Büro')

  return (
    <>
      <PageHeader
        title={`Bericht ${formatReportNumber(report.report_number)}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ReportStatusBadge status={report.status} />
            <span>{formatDateLong(report.report_date)}</span>
          </span>
        }
        back={{ href: '/intern/berichte', label: 'Berichte' }}
        actions={
          canEdit ? (
            <Button asChild variant="outline">
              <Link href={`/intern/berichte/${report.id}/bearbeiten`}>
                <Pencil /> {report.status === 'freigegeben' ? 'Korrigieren' : 'Bearbeiten'}
              </Link>
            </Button>
          ) : null
        }
      />
      <PageBody className="max-w-4xl">
        {report.status === 'korrektur_erforderlich' && report.review_comment ? (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
            <div className="font-medium text-warning">Korrektur angefordert</div>
            <div className="mt-1">{report.review_comment}</div>
          </div>
        ) : null}

        {ctx.isOffice && (report.status === 'eingereicht' || report.status === 'freigegeben') ? (
          <Card>
            <CardHeader>
              <CardTitle>Prüfung</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewPanel reportId={report.id} version={report.version} status={report.status} />
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ausgeführte Arbeiten</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length ? (
                  <ul className="space-y-2">
                    {activities.map((a) => (
                      <li key={a.id} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{a.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Arbeiten erfasst.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length ? (
                  <ul className="divide-y">
                    {materials.map((m) => (
                      <li key={m.id} className="flex gap-3 py-2 first:pt-0 last:pb-0">
                        <span className="tabular w-20 shrink-0 font-medium">
                          {formatQuantity(m.quantity)} × {m.unit}
                        </span>
                        <span className="min-w-0">
                          <span className="block">{m.description}</span>
                          {m.manufacturer || m.article_number || m.supplier_article_number || m.supplier_reference ? (
                            <span className="block text-xs text-muted-foreground">
                              {[m.manufacturer, m.article_number && `Art.-Nr. ${m.article_number}`, m.supplier_article_number && `Lief.-Nr. ${m.supplier_article_number}`, m.supplier_reference]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Kein Material erfasst.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Arbeitszeiten</CardTitle>
                <span className="tabular text-sm font-semibold">{formatMinutes(totalMinutes)}</span>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {report.time_links.map((l) => (
                    <li key={l.employee_id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <span>{directory.name(l.employee_id)}</span>
                      <span className="tabular text-right text-sm">
                        <span className="font-medium">{formatMinutes(l.time_entry?.duration_minutes ?? 0)}</span>
                        {l.time_entry?.started_at && l.time_entry.ended_at ? (
                          <span className="block text-xs text-muted-foreground">
                            {utcToBerlinTime(l.time_entry.started_at)}–{utcToBerlinTime(l.time_entry.ended_at)}
                            {l.time_entry.break_minutes ? `, ${l.time_entry.break_minutes} min Pause` : ''}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {!report.time_links.length ? <p className="text-sm text-muted-foreground">Keine Zeiten erfasst.</p> : null}
              </CardContent>
            </Card>

            {report.internal_notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Interne Notiz</CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap text-sm">{report.internal_notes}</CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kunde & Auftrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {report.job?.customer ? (
                  <div>
                    <Link href={`/intern/kunden/${report.job.customer.id}`} className="font-medium hover:underline">
                      {customerName(report.job.customer)}
                    </Link>
                    {report.job.customer.phone ? (
                      <a href={`tel:${report.job.customer.phone}`} className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {report.job.customer.phone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {report.job ? (
                  <Link href={`/intern/auftraege/${report.job.id}`} className="block rounded-lg bg-muted p-2.5 hover:bg-accent">
                    <span className="block font-medium">{report.job.title}</span>
                    <span className="text-xs text-muted-foreground">{formatJobNumber(report.job.job_number)}</span>
                  </Link>
                ) : null}
                {report.job?.location ? (
                  <p className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {formatAddress(report.job.location)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Verlauf</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Erstellt von {creator}
                  <br />
                  {formatDateTime(report.created_at)}
                </p>
                {report.submitted_at ? <p className="text-muted-foreground">Eingereicht: {formatDateTime(report.submitted_at)}</p> : null}
                {report.reviewed_at ? <p className="text-muted-foreground">Geprüft: {formatDateTime(report.reviewed_at)}</p> : null}
                {history.length ? (
                  <ol className="mt-3 space-y-3 border-l pl-3">
                    {history.map((h) => (
                      <li key={h.id}>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {formatDateTime(h.at)}
                          {h.actorId ? ` · ${directory.profileName(h.actorId) ?? 'Büro'}` : ''}
                        </div>
                        <div>{h.text}</div>
                        {h.reason ? <div className="text-xs text-muted-foreground">Begründung: {h.reason}</div> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}
