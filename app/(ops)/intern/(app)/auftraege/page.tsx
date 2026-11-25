import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MapPin, Plus, Search } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadDirectory } from '@/lib/ops/data/common'
import { JOB_CATEGORY_LABELS, JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/lib/ops/domain/labels'
import { formatDate } from '@/lib/ops/domain/dates'
import type { JobCategory, JobStatus } from '@/lib/ops/domain/types'
import { EmptyState, PageBody, PageHeader } from '@/components/ops/page-header'
import { JobStatusBadge } from '@/components/ops/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { cn, customerName, formatJobNumber, fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Aufträge' }

interface JobRow {
  id: string
  job_number: number
  title: string
  status: JobStatus
  category: JobCategory
  start_date: string
  customer: { first_name: string | null; last_name: string | null; company_name: string | null } | null
  location: { city: string } | null
  assignments: { employee_id: string }[]
}

export default async function JobsPage({ searchParams }: { searchParams: { status?: string; q?: string; mitarbeiter?: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const directory = await loadDirectory(supabase)
  const status = JOB_STATUS_ORDER.includes(searchParams.status as JobStatus) ? (searchParams.status as JobStatus) : undefined
  const employeeId = directory.list.some((e) => e.id === searchParams.mitarbeiter) ? searchParams.mitarbeiter : undefined
  const q = (searchParams.q ?? '').trim().slice(0, 100)

  let query = supabase
    .from('auftraege')
    .select(
      `id, job_number, title, status, category, start_date,
       customer:kunden(first_name, last_name, company_name), location:einsatzorte(city),
       assignments:auftragszuweisungen${employeeId ? '!inner' : ''}(employee_id)`,
    )
    .is('archived_at', null)
  if (status) query = query.eq('status', status)
  else query = query.neq('status', 'abgerechnet')
  if (employeeId) query = query.eq('assignments.employee_id', employeeId)
  if (q) query = query.ilike('title', `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
  const { data } = await query.order('start_date', { ascending: false }).limit(300)
  const jobs = (data ?? []) as unknown as JobRow[]

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...searchParams, ...patch })) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/intern/auftraege?${s}` : '/intern/auftraege'
  }

  return (
    <>
      <PageHeader
        title="Aufträge"
        description={status ? JOB_STATUS_LABELS[status] : 'Offene Aufträge'}
        actions={
          ctx.isOffice ? (
            <Button asChild>
              <Link href="/intern/auftraege/neu">
                <Plus /> Neuer Auftrag
              </Link>
            </Button>
          ) : null
        }
      />
      <PageBody>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip href={href({ status: undefined })} active={!status}>
            Offen
          </Chip>
          {JOB_STATUS_ORDER.map((s) => (
            <Chip key={s} href={href({ status: s })} active={status === s}>
              {JOB_STATUS_LABELS[s]}
            </Chip>
          ))}
        </div>
        <form method="get" className="flex flex-wrap gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" type="search" defaultValue={q} placeholder="Auftragstitel …" className="pl-9" aria-label="Aufträge durchsuchen" />
          </div>
          {ctx.isOffice ? (
            <div className="min-w-[12rem]">
              <NativeSelect name="mitarbeiter" defaultValue={employeeId ?? ''} aria-label="Mitarbeiter">
                <option value="">Alle Mitarbeiter</option>
                {directory.active.map((e) => (
                  <option key={e.id} value={e.id}>
                    {fullName(e)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <Button type="submit" variant="secondary">
            Filtern
          </Button>
        </form>

        {jobs.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link href={`/intern/auftraege/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{j.customer ? customerName(j.customer) : '—'}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {j.title} · {JOB_CATEGORY_LABELS[j.category]}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>{formatJobNumber(j.job_number)}</span>
                      <span>ab {formatDate(j.start_date)}</span>
                      {j.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {j.location.city}
                        </span>
                      ) : null}
                      {j.assignments.length ? <span>{j.assignments.map((a) => directory.name(a.employee_id).split(' ')[0]).join(', ')}</span> : null}
                    </div>
                  </div>
                  <JobStatusBadge status={j.status} />
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Keine Aufträge gefunden" />
        )}
      </PageBody>
    </>
  )
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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
