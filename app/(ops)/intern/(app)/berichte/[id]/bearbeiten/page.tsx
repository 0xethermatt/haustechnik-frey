import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory, loadJobOptions } from '@/lib/ops/data/common'
import { loadReportDetail } from '@/lib/ops/data/reports'
import { reportToFormState } from '@/lib/ops/report-form-state'
import { PageHeader } from '@/components/ops/page-header'
import { ReportForm } from '@/components/ops/report-form/report-form'
import { formatReportNumber } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Bericht bearbeiten' }

export default async function EditReportPage({ params }: { params: { id: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const [report, jobs, directory] = await Promise.all([
    loadReportDetail(supabase, params.id),
    loadJobOptions(supabase),
    loadDirectory(supabase),
  ])
  if (!report) notFound()

  // Der aktuelle Auftrag muss auswählbar bleiben, auch wenn er inzwischen abgerechnet ist.
  if (report.job && !jobs.some((j) => j.id === report.job_id)) {
    jobs.unshift({
      id: report.job.id,
      job_number: report.job.job_number,
      title: report.job.title,
      status: report.job.status,
      category: 'sonstiges',
      start_date: report.report_date,
      customer: report.job.customer,
      location: report.job.location,
    })
  }

  const canEdit = ctx.isOffice || (report.created_by === ctx.userId && ['entwurf', 'korrektur_erforderlich'].includes(report.status))

  return (
    <>
      <PageHeader
        title={`Bericht ${formatReportNumber(report.report_number)} bearbeiten`}
        back={{ href: `/intern/berichte/${report.id}`, label: 'Zum Bericht' }}
      />
      <ReportForm
        initial={{
          id: report.id,
          isNew: false,
          version: report.version,
          status: report.status,
          reviewComment: report.review_comment,
          state: reportToFormState(report),
        }}
        jobs={jobs}
        employees={directory.list}
        currentEmployeeId={ctx.employee?.id ?? null}
        isOffice={ctx.isOffice}
        canEdit={canEdit}
      />
    </>
  )
}
