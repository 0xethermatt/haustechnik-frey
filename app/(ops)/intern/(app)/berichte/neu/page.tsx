import type { Metadata } from 'next'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory, loadJobOptions } from '@/lib/ops/data/common'
import { PageHeader } from '@/components/ops/page-header'
import { ReportForm } from '@/components/ops/report-form/report-form'
import { newReportState } from '@/lib/ops/report-form-state'
import { InternalEntryForm } from '@/components/ops/internal-entry-form'
import { INTERNAL_KIND_TITLES, isInternalKind } from '@/lib/ops/domain/internal-work'
import { EmptyState } from '@/components/ops/page-header'
import { addDays, berlinToday, isoWeekday } from '@/lib/ops/domain/dates'
import { holidayName } from '@/lib/ops/domain/holidays'
import { loadWorkDays } from '@/lib/ops/data/time'
import { SchoolDaysForm } from '@/components/ops/school-days-form'

export const metadata: Metadata = { title: 'Neuer Arbeitsbericht' }

export default async function NewReportPage({ searchParams }: { searchParams: { auftrag?: string; art?: string } }) {
  const ctx = await requireSession()
  if (searchParams.art === 'schule') {
    const supabase = createClient()
    const isApprentice = ctx.employee?.employment_role === 'auszubildender'
    const today = berlinToday()
    const workDays = ctx.employee && isApprentice ? await loadWorkDays(supabase, { from: addDays(today, -20), to: today, employeeIds: [ctx.employee.id] }) : []
    const days = Array.from({ length: 21 }, (_, i) => addDays(today, -i))
      .filter((d) => isoWeekday(d) <= 5)
      .map((date) => {
        const wd = workDays.find((w) => w.work_date === date)
        return { date, isSchool: !!wd?.berufsschule, hasOtherWorkDay: !!wd && !wd.berufsschule, holiday: holidayName(date) }
      })
    return (
      <>
        <PageHeader title="Berufsschule" description="Berufsschultage eintragen, auch nachträglich" back={{ href: '/intern', label: 'Zurück' }} />
        {ctx.employee && isApprentice ? (
          <SchoolDaysForm employeeId={ctx.employee.id} days={days} today={today} />
        ) : (
          <div className="p-4">
            <EmptyState title="Nur für Auszubildende" description="Die Berufsschule kann nur bei Mitarbeitern mit der Beschäftigungsart „Auszubildender“ erfasst werden." />
          </div>
        )}
      </>
    )
  }
  if (isInternalKind(searchParams.art)) {
    return (
      <>
        <PageHeader title={INTERNAL_KIND_TITLES[searchParams.art]} description="Arbeit ohne Kunde, zählt zur Arbeitszeit" back={{ href: '/intern', label: 'Zurück' }} />
        {ctx.employee ? (
          <InternalEntryForm employeeId={ctx.employee.id} today={berlinToday()} initialKind={searchParams.art} />
        ) : (
          <div className="p-4">
            <EmptyState title="Kein Mitarbeiterdatensatz" description="Diese Erfassung ist nur für Mitarbeiter mit verknüpftem Mitarbeiterdatensatz möglich." />
          </div>
        )}
      </>
    )
  }
  const supabase = createClient()
  const [jobs, directory] = await Promise.all([loadJobOptions(supabase), loadDirectory(supabase)])
  const jobId = searchParams.auftrag && jobs.some((j) => j.id === searchParams.auftrag) ? searchParams.auftrag : null

  return (
    <>
      <PageHeader title="Neuer Arbeitsbericht" back={{ href: '/intern', label: 'Zurück' }} />
      <ReportForm
        initial={{
          id: crypto.randomUUID(),
          isNew: true,
          version: null,
          status: 'entwurf',
          reviewComment: null,
          state: newReportState({ jobId, employeeId: ctx.employee?.id ?? null }),
        }}
        jobs={jobs}
        employees={directory.list}
        currentEmployeeId={ctx.employee?.id ?? null}
        isOffice={ctx.isOffice}
        canEdit
      />
    </>
  )
}
