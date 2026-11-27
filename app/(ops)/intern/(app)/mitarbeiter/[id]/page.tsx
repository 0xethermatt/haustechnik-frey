import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock } from 'lucide-react'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { addDays, berlinToday } from '@/lib/ops/domain/dates'
import type { Employee, EmploymentRole } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { EmployeeForm } from '@/components/ops/employee-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fullName } from '@/lib/ops/utils'
import { AbsenceManager } from './absence-manager'

export const metadata: Metadata = { title: 'Mitarbeiter' }

export default async function EmployeePage({ params }: { params: { id: string } }) {
  await requireOffice()
  const supabase = createClient()
  const today = berlinToday()
  const [{ data }, { data: absences }] = await Promise.all([
    supabase.from('mitarbeiter').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('fehlzeiten')
      .select('id, absence_type, start_date, end_date, half_day, note')
      .eq('employee_id', params.id)
      .gte('end_date', addDays(today, -90))
      .order('start_date', { ascending: false }),
  ])
  if (!data) notFound()
  const { data: profile } = data.profile_id
    ? await supabase.from('benutzerprofile').select('email').eq('id', data.profile_id).maybeSingle()
    : { data: null }
  const e = data as Employee

  return (
    <>
      <PageHeader
        title={fullName(e)}
        description={profile?.email ? `Zugang: ${profile.email}` : 'Kein App-Zugang'}
        back={{ href: '/intern/mitarbeiter', label: 'Mitarbeiter' }}
        actions={
          <Button asChild variant="outline">
            <Link href={`/intern/zeiten?mitarbeiter=${e.id}`}>
              <Clock /> Zeiten
            </Link>
          </Button>
        }
      />
      <PageBody className="max-w-3xl">
        <EmployeeForm
          id={e.id}
          initial={{
            employee_number: e.employee_number,
            first_name: e.first_name,
            last_name: e.last_name,
            employment_role: e.employment_role as EmploymentRole,
            is_active: e.is_active,
            start_date: e.start_date,
            end_date: e.end_date ?? '',
            weekly_target_hours: String(e.weekly_target_minutes / 60).replace('.', ','),
            annual_vacation_days: String(e.annual_vacation_days).replace('.', ','),
            requires_time_tracking: e.requires_time_tracking !== false,
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Abwesenheiten</CardTitle>
          </CardHeader>
          <CardContent>
            <AbsenceManager employeeId={e.id} absences={absences ?? []} today={today} />
          </CardContent>
        </Card>
      </PageBody>
    </>
  )
}
