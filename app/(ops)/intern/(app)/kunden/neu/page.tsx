import type { Metadata } from 'next'
import { requireSession } from '@/lib/ops/auth'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { CustomerForm, emptyCustomerValues } from '@/components/ops/customer-form'

export const metadata: Metadata = { title: 'Neuer Kunde' }

export default async function NewCustomerPage() {
  const ctx = await requireSession()
  return (
    <>
      <PageHeader title="Neuer Kunde" back={{ href: '/intern/kunden', label: 'Kunden' }} />
      <PageBody className="max-w-3xl">
        <CustomerForm initial={emptyCustomerValues} canEditNumbers={ctx.isOffice} />
      </PageBody>
    </>
  )
}
