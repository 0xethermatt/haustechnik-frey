import type { Metadata } from 'next'
import { requireOffice } from '@/lib/ops/auth'
import { berlinToday } from '@/lib/ops/domain/dates'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { EmployeeForm } from '@/components/ops/employee-form'

export const metadata: Metadata = { title: 'Neuer Mitarbeiter' }

export default async function NewEmployeePage() {
  await requireOffice()
  return (
    <>
      <PageHeader title="Neuer Mitarbeiter" back={{ href: '/intern/mitarbeiter', label: 'Mitarbeiter' }} />
      <PageBody className="max-w-3xl">
        <EmployeeForm
          initial={{
            employee_number: '',
            first_name: '',
            last_name: '',
            employment_role: 'geselle',
            is_active: true,
            start_date: berlinToday(),
            end_date: '',
            weekly_target_hours: '40',
            annual_vacation_days: '30',
            requires_time_tracking: true,
          }}
        />
      </PageBody>
    </>
  )
}
