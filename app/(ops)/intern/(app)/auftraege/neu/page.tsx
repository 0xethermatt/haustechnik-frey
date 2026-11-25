import type { Metadata } from 'next'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadJobFormOptions } from '@/lib/ops/data/jobs'
import { berlinToday } from '@/lib/ops/domain/dates'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { JobForm } from '@/components/ops/job-form'

export const metadata: Metadata = { title: 'Neuer Auftrag' }

export default async function NewJobPage({ searchParams }: { searchParams: { kunde?: string } }) {
  await requireOffice()
  const supabase = createClient()
  const [{ customers, locations }, directory] = await Promise.all([loadJobFormOptions(supabase), loadDirectory(supabase)])
  const customerId = customers.some((c) => c.id === searchParams.kunde) ? searchParams.kunde! : ''
  return (
    <>
      <PageHeader title="Neuer Auftrag" back={{ href: '/intern/auftraege', label: 'Aufträge' }} />
      <PageBody className="max-w-3xl">
        <JobForm
          customers={customers}
          locations={locations}
          employees={directory.list}
          initial={{
            customer_id: customerId,
            service_location_id: locations.find((l) => l.customer_id === customerId)?.id ?? '',
            title: '',
            description: '',
            category: 'kundendienst',
            start_date: berlinToday(),
            completion_date: '',
            notes: '',
            assigned_employee_ids: [],
          }}
        />
      </PageBody>
    </>
  )
}
