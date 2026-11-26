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
import { berlinToday } from '@/lib/ops/domain/dates'

export const metadata: Metadata = { title: 'Neuer Arbeitsbericht' }

export default async function NewReportPage({ searchParams }: { searchParams: { auftrag?: string; art?: string } }) {
  const ctx = await requireSession()
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
