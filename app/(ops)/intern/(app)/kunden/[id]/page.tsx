import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail, MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { formatDate } from '@/lib/ops/domain/dates'
import { JOB_CATEGORY_LABELS } from '@/lib/ops/domain/labels'
import type { JobCategory, JobStatus } from '@/lib/ops/domain/types'
import { EmptyState, PageBody, PageHeader } from '@/components/ops/page-header'
import { JobStatusBadge } from '@/components/ops/status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerName, formatAddress, formatCustomerNumber, formatJobNumber } from '@/lib/ops/utils'
import { AddLocationSheet, ArchiveCustomerButton } from './customer-actions'

export const metadata: Metadata = { title: 'Kunde' }

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const [{ data: c }, { data: locations }, { data: jobs }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('service_locations').select('*').eq('customer_id', params.id).is('archived_at', null).order('created_at'),
    supabase
      .from('jobs')
      .select('id, job_number, title, status, category, start_date, completion_date, location:service_locations(city)')
      .eq('customer_id', params.id)
      .order('start_date', { ascending: false }),
  ])
  if (!c) notFound()
  const contactName = c.company_name ? [c.first_name, c.last_name].filter(Boolean).join(' ') : null

  return (
    <>
      <PageHeader
        title={customerName(c)}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatCustomerNumber(c.customer_number)}
            {c.edison_customer_number ? <Badge variant="outline">Edison {c.edison_customer_number}</Badge> : null}
            {c.archived_at ? <Badge variant="muted">Archiviert</Badge> : null}
          </span>
        }
        back={{ href: '/intern/kunden', label: 'Kunden' }}
        actions={
          ctx.isOffice ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/intern/kunden/${c.id}/bearbeiten`}>
                  <Pencil /> Bearbeiten
                </Link>
              </Button>
              <ArchiveCustomerButton id={c.id} archived={!!c.archived_at} />
            </>
          ) : null
        }
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-[20rem_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contactName ? <p>Ansprechpartner: {contactName}</p> : null}
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" /> {c.phone}
                  </a>
                ) : null}
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-primary">
                    <Mail className="h-4 w-4" /> {c.email}
                  </a>
                ) : null}
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground">Rechnungsadresse</div>
                  <div>{formatAddress({ street: c.billing_street, postal_code: c.billing_postal_code, city: c.billing_city }) || '—'}</div>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">Angelegt am {formatDate(c.created_at.slice(0, 10))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Einsatzorte</CardTitle>
                <AddLocationSheet customerId={c.id} />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(locations ?? []).map((l) => (
                  <div key={l.id} className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      {l.label ? <div className="font-medium">{l.label}</div> : null}
                      <a
                        className="hover:underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(l))}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {formatAddress(l)}
                      </a>
                      {l.access_notes ? <div className="text-xs text-muted-foreground">{l.access_notes}</div> : null}
                    </div>
                  </div>
                ))}
                {!locations?.length ? <p className="text-muted-foreground">Kein Einsatzort hinterlegt.</p> : null}
              </CardContent>
            </Card>
            {c.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Interne Notizen</CardTitle>
                </CardHeader>
                <CardContent className="whitespace-pre-wrap text-sm">{c.notes}</CardContent>
              </Card>
            ) : null}
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Aufträge</h2>
              <div className="flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/intern/berichte?kunde=${c.id}`}>Berichte</Link>
                </Button>
                {ctx.isOffice ? (
                  <Button asChild size="sm">
                    <Link href={`/intern/auftraege/neu?kunde=${c.id}`}>
                      <Plus /> Auftrag
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
            {jobs?.length ? (
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <Link href={`/intern/auftraege/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{j.title}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {formatJobNumber(j.job_number)} · {JOB_CATEGORY_LABELS[j.category as JobCategory]} · ab {formatDate(j.start_date)}
                        </div>
                      </div>
                      <JobStatusBadge status={j.status as JobStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Noch keine Aufträge" />
            )}
          </section>
        </div>
      </PageBody>
    </>
  )
}
