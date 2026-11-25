import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { loadReports } from '@/lib/ops/data/reports'
import { REPORT_STATUS_LABELS } from '@/lib/ops/domain/labels'
import { isIsoDate } from '@/lib/ops/domain/dates'
import type { ReportStatus } from '@/lib/ops/domain/types'
import { EmptyState, PageBody, PageHeader } from '@/components/ops/page-header'
import { ReportList } from '@/components/ops/report-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { cn, customerName, fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Arbeitsberichte' }

const STATUSES = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]
const UUID_RE = /^[0-9a-f-]{36}$/i

interface Search {
  status?: string
  von?: string
  bis?: string
  mitarbeiter?: string
  kunde?: string
  auftrag?: string
}

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const status = STATUSES.includes(searchParams.status as ReportStatus) ? (searchParams.status as ReportStatus) : undefined
  const from = searchParams.von && isIsoDate(searchParams.von) ? searchParams.von : undefined
  const to = searchParams.bis && isIsoDate(searchParams.bis) ? searchParams.bis : undefined
  const employeeId = searchParams.mitarbeiter && UUID_RE.test(searchParams.mitarbeiter) ? searchParams.mitarbeiter : undefined
  const customerId = searchParams.kunde && UUID_RE.test(searchParams.kunde) ? searchParams.kunde : undefined
  const jobId = searchParams.auftrag && UUID_RE.test(searchParams.auftrag) ? searchParams.auftrag : undefined

  const [reports, directory, customer, job] = await Promise.all([
    loadReports(supabase, { status, from, to, employeeId, customerId, jobId }),
    loadDirectory(supabase),
    customerId ? supabase.from('kunden').select('first_name, last_name, company_name').eq('id', customerId).maybeSingle() : null,
    jobId ? supabase.from('auftraege').select('title').eq('id', jobId).maybeSingle() : null,
  ])

  const params = (patch: Partial<Search>) => {
    const p = new URLSearchParams()
    const merged = { ...searchParams, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/intern/berichte?${s}` : '/intern/berichte'
  }

  return (
    <>
      <PageHeader
        title="Arbeitsberichte"
        description={`${reports.length} ${reports.length === 1 ? 'Bericht' : 'Berichte'}`}
        actions={
          <Button asChild>
            <Link href="/intern/berichte/neu">
              <Plus /> Neuer Bericht
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <FilterChip href={params({ status: undefined })} active={!status}>
            Alle
          </FilterChip>
          {STATUSES.map((s) => (
            <FilterChip key={s} href={params({ status: s })} active={status === s}>
              {REPORT_STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>

        <form method="get" className="grid grid-cols-2 gap-2 rounded-xl border bg-card p-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {customerId ? <input type="hidden" name="kunde" value={customerId} /> : null}
          {jobId ? <input type="hidden" name="auftrag" value={jobId} /> : null}
          <label className="space-y-1 text-xs text-muted-foreground">
            Von
            <Input type="date" name="von" defaultValue={from} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Bis
            <Input type="date" name="bis" defaultValue={to} />
          </label>
          {ctx.isOffice ? (
            <label className="col-span-2 space-y-1 text-xs text-muted-foreground md:col-span-2">
              Mitarbeiter
              <NativeSelect name="mitarbeiter" defaultValue={employeeId ?? ''}>
                <option value="">Alle Mitarbeiter</option>
                {directory.list.map((e) => (
                  <option key={e.id} value={e.id}>
                    {fullName(e)}
                  </option>
                ))}
              </NativeSelect>
            </label>
          ) : null}
          <div className="col-span-2 flex items-end gap-2 md:col-span-1">
            <Button type="submit" variant="secondary" className="flex-1">
              Filtern
            </Button>
            {from || to || employeeId ? (
              <Button asChild variant="ghost">
                <Link href={params({ von: undefined, bis: undefined, mitarbeiter: undefined })}>Zurücksetzen</Link>
              </Button>
            ) : null}
          </div>
        </form>

        {customer?.data || job?.data ? (
          <div className="flex flex-wrap gap-2">
            {customer?.data ? (
              <RemovableChip href={params({ kunde: undefined })}>Kunde: {customerName(customer.data)}</RemovableChip>
            ) : null}
            {job?.data ? <RemovableChip href={params({ auftrag: undefined })}>Auftrag: {job.data.title}</RemovableChip> : null}
          </div>
        ) : null}

        {reports.length ? (
          <ReportList reports={reports} directory={directory} />
        ) : (
          <EmptyState
            title="Keine Berichte gefunden"
            description="Passen Sie die Filter an oder erstellen Sie einen neuen Bericht."
            action={
              <Button asChild>
                <Link href="/intern/berichte/neu">
                  <Plus /> Neuer Bericht
                </Link>
              </Button>
            }
          />
        )}
      </PageBody>
    </>
  )
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

function RemovableChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-sm text-accent-foreground">
      {children}
      <X className="h-3.5 w-3.5" />
    </Link>
  )
}
