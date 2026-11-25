import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadJobFormOptions } from '@/lib/ops/data/jobs'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { JobForm } from '@/components/ops/job-form'
import type { JobCategory } from '@/lib/ops/domain/types'

export const metadata: Metadata = { title: 'Auftrag bearbeiten' }

export default async function EditJobPage({ params }: { params: { id: string } }) {
  await requireOffice()
  const supabase = createClient()
  const [{ data: job }, { data: assignments }, options, directory] = await Promise.all([
    supabase.from('auftraege').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('auftragszuweisungen').select('employee_id').eq('job_id', params.id),
    loadJobFormOptions(supabase),
    loadDirectory(supabase),
  ])
  if (!job) notFound()
  return (
    <>
      <PageHeader title="Auftrag bearbeiten" back={{ href: `/intern/auftraege/${job.id}`, label: 'Zum Auftrag' }} />
      <PageBody className="max-w-3xl">
        <JobForm
          jobId={job.id}
          customers={options.customers.some((c) => c.id === job.customer_id) ? options.customers : [{ id: job.customer_id, name: 'Archivierter Kunde' }, ...options.customers]}
          locations={options.locations}
          employees={directory.list}
          initial={{
            customer_id: job.customer_id,
            service_location_id: job.service_location_id ?? '',
            title: job.title,
            description: job.description ?? '',
            category: job.category as JobCategory,
            start_date: job.start_date,
            completion_date: job.completion_date ?? '',
            notes: job.notes ?? '',
            assigned_employee_ids: (assignments ?? []).map((a) => a.employee_id),
          }}
        />
      </PageBody>
    </>
  )
}
