import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { CustomerForm } from '@/components/ops/customer-form'
import { customerName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Kunde bearbeiten' }

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  await requireOffice()
  const supabase = createClient()
  const { data: c } = await supabase.from('customers').select('*').eq('id', params.id).maybeSingle()
  if (!c) notFound()
  return (
    <>
      <PageHeader title={`${customerName(c)} bearbeiten`} back={{ href: `/intern/kunden/${c.id}`, label: 'Zum Kunden' }} />
      <PageBody className="max-w-3xl">
        <CustomerForm
          customerId={c.id}
          canEditNumbers
          initial={{
            first_name: c.first_name ?? '',
            last_name: c.last_name ?? '',
            company_name: c.company_name ?? '',
            edison_customer_number: c.edison_customer_number ?? '',
            short_name: c.short_name ?? '',
            billing_street: c.billing_street ?? '',
            billing_postal_code: c.billing_postal_code ?? '',
            billing_city: c.billing_city ?? '',
            phone: c.phone ?? '',
            email: c.email ?? '',
            notes: c.notes ?? '',
          }}
        />
      </PageBody>
    </>
  )
}
