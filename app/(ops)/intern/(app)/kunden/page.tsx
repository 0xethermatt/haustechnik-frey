import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { EmptyState, PageBody, PageHeader } from '@/components/ops/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, customerName, formatCustomerNumber } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Kunden' }

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string; archiv?: string } }) {
  const ctx = await requireSession()
  const supabase = createClient()
  const q = (searchParams.q ?? '').trim().toLowerCase().slice(0, 100)
  const archived = searchParams.archiv === '1'

  let query = supabase
    .from('kunden')
    .select('id, customer_number, edison_customer_number, first_name, last_name, company_name, billing_postal_code, billing_city, phone, archived_at')
  query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  if (q) {
    const digits = q.replace(/\D/g, '')
    const term = /^[\d\s/+()-]+$/.test(q) && digits.length >= 4 ? digits : q
    query = query.ilike('search_text', `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
  }
  const { data } = await query.order('last_name', { nullsFirst: false }).order('company_name').limit(200)
  const customers = data ?? []

  return (
    <>
      <PageHeader
        title="Kunden"
        description={`${customers.length}${customers.length === 200 ? '+' : ''} ${archived ? 'archivierte ' : ''}Kunden`}
        actions={
          <Button asChild>
            <Link href="/intern/kunden/neu">
              <Plus /> Neuer Kunde
            </Link>
          </Button>
        }
      />
      <PageBody>
        <form method="get" className="flex gap-2">
          {archived ? <input type="hidden" name="archiv" value="1" /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={searchParams.q} placeholder="Name, Firma, Ort, Telefon, Kundennr. …" className="pl-9" type="search" aria-label="Kunden suchen" />
          </div>
          <Button type="submit" variant="secondary">
            Suchen
          </Button>
        </form>
        {ctx.isOffice ? (
          <div className="flex gap-2 text-sm">
            <Link href="/intern/kunden" className={cn('rounded-full px-3 py-1', !archived ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground')}>
              Aktiv
            </Link>
            <Link href="/intern/kunden?archiv=1" className={cn('rounded-full px-3 py-1', archived ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground')}>
              Archiviert
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sie sehen Kunden Ihrer Aufträge. Weitere Bestandskunden finden Sie beim Anlegen eines Auftrags über die Suche.</p>
        )}
        {customers.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {customers.map((c) => (
              <li key={c.id}>
                <Link href={`/intern/kunden/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{customerName(c)}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {[c.company_name && [c.first_name, c.last_name].filter(Boolean).join(' '), [c.billing_postal_code, c.billing_city].filter(Boolean).join(' '), c.phone]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                    {formatCustomerNumber(c.customer_number)}
                    {c.edison_customer_number ? <div>Edison {c.edison_customer_number}</div> : null}
                  </div>
                  {c.archived_at ? <Badge variant="muted">Archiviert</Badge> : null}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={q ? 'Keine Treffer' : 'Noch keine Kunden'} description={q ? 'Andere Schreibweise oder Telefonnummer versuchen.' : undefined} />
        )}
      </PageBody>
    </>
  )
}
