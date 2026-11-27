'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AlertTriangle, Building2, Check, ChevronRight, Loader2, MapPin, Plus, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { INTERNAL_KINDS, INTERNAL_KIND_LABELS } from '@/lib/ops/domain/internal-work'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { JOB_CATEGORY_LABELS, JOB_STATUS_LABELS } from '@/lib/ops/domain/labels'
import type { JobCategory, JobStatus } from '@/lib/ops/domain/types'
import type { JobOption } from '@/lib/ops/data/common'
import { cn, customerName, formatAddress, formatJobNumber } from '@/lib/ops/utils'
import { checkDuplicates, createCustomer, searchCustomers, type CustomerHit, type DuplicateHit } from '@/app/(ops)/intern/(app)/kunden/actions'
import { quickCreateJob } from '@/app/(ops)/intern/(app)/auftraege/actions'

type Step = 'pick' | 'customer' | 'new-customer' | 'job'

const QUICK_CATEGORIES: JobCategory[] = ['kundendienst', 'reparatur', 'wartung', 'sanitaer', 'heizung', 'waermepumpe', 'badsanierung', 'sonstiges']

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function JobSummary({ job }: { job: JobOption }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{job.customer ? customerName(job.customer) : 'Kunde'}</div>
      <div className="truncate text-sm text-muted-foreground">
        {job.title} · {formatJobNumber(job.job_number)}
      </div>
      {job.location ? (
        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" /> {formatAddress(job.location)}
        </div>
      ) : null}
    </div>
  )
}

export function JobPicker({
  jobs,
  value,
  onChange,
  error,
  disabled,
  showSchool = false,
}: {
  jobs: JobOption[]
  value: string | null
  onChange: (job: JobOption) => void
  error?: string
  disabled?: boolean
  /** Azubis: zusätzlich „Schule“ bei „Arbeit ohne Kunde“ */
  showSchool?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('pick')
  const [query, setQuery] = useState('')
  const [extraJobs, setExtraJobs] = useState<JobOption[]>([])
  const [customer, setCustomer] = useState<CustomerHit | null>(null)

  const allJobs = useMemo(() => [...extraJobs, ...jobs.filter((j) => !extraJobs.some((e) => e.id === j.id))], [jobs, extraJobs])
  const selected = allJobs.find((j) => j.id === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allJobs.slice(0, 50)
    return allJobs
      .filter((j) =>
        [j.title, j.customer ? customerName(j.customer) : '', j.location?.city ?? '', j.location?.street ?? '', String(j.job_number)]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 50)
  }, [allJobs, query])

  const openSheet = () => {
    setStep('pick')
    setQuery('')
    setCustomer(null)
    setOpen(true)
  }

  const select = (job: JobOption) => {
    onChange(job)
    setOpen(false)
  }

  return (
    <>
      {selected ? (
        <button
          type="button"
          disabled={disabled}
          onClick={openSheet}
          className="flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left active:bg-accent disabled:opacity-60"
        >
          <JobSummary job={selected} />
          {!disabled ? <span className="ml-auto shrink-0 text-sm font-medium text-primary">Ändern</span> : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={openSheet}
          className={cn(
            'flex h-14 w-full items-center gap-3 rounded-xl border border-dashed bg-background px-4 text-left text-muted-foreground active:bg-accent',
            error && 'border-destructive text-destructive',
          )}
        >
          <Search className="h-5 w-5" />
          <span className="flex-1">Kunde oder Auftrag wählen</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={step === 'pick' ? 'Auftrag wählen' : step === 'job' ? 'Neuer Auftrag' : step === 'new-customer' ? 'Neuer Kunde' : 'Kunde suchen'}
          className="md:max-w-xl"
        >
          {step === 'pick' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kunde, Ort oder Auftrag …"
                  className="pl-9"
                  aria-label="Aufträge durchsuchen"
                />
              </div>
              <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setStep('customer')}>
                <Plus /> Neuer Auftrag (Kunde suchen oder anlegen)
              </Button>
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">Arbeit ohne Kunde</div>
                <div className={showSchool ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-4 gap-1.5'}>
                  {showSchool ? (
                    <button
                      type="button"
                      onClick={() => router.push('/intern/berichte/neu?art=schule')}
                      className="h-10 rounded-lg border border-primary/40 bg-primary/5 text-sm font-medium text-primary active:bg-accent"
                    >
                      Schule
                    </button>
                  ) : null}
                  {INTERNAL_KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => router.push(`/intern/berichte/neu?art=${k}`)}
                      className="h-10 rounded-lg border bg-background text-sm font-medium active:bg-accent"
                    >
                      {INTERNAL_KIND_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="divide-y rounded-xl border">
                {filtered.length === 0 ? (
                  <li className="p-4 text-center text-sm text-muted-foreground">Kein passender Auftrag.</li>
                ) : (
                  filtered.map((job) => (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => select(job)}
                        className="flex w-full items-center gap-3 p-3 text-left active:bg-accent"
                      >
                        <JobSummary job={job} />
                        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                          {job.id === value ? <Check className="h-4 w-4 text-primary" /> : null}
                          <Badge variant="muted">{JOB_STATUS_LABELS[job.status as JobStatus]}</Badge>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}

          {step === 'customer' ? (
            <CustomerSearch
              onPick={(c) => {
                setCustomer(c)
                setStep('job')
              }}
              onCreateNew={() => setStep('new-customer')}
              onBack={() => setStep('pick')}
            />
          ) : null}

          {step === 'new-customer' ? (
            <NewCustomerForm
              onCreated={(c) => {
                setCustomer(c)
                setStep('job')
              }}
              onUseExisting={(c) => {
                setCustomer(c)
                setStep('job')
              }}
              onBack={() => setStep('customer')}
            />
          ) : null}

          {step === 'job' && customer ? (
            <QuickJobForm
              customer={customer}
              onBack={() => setStep('customer')}
              onCreated={(job) => {
                setExtraJobs((prev) => [job, ...prev])
                select(job)
                toast.success(`Auftrag ${formatJobNumber(job.job_number)} angelegt`)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function CustomerSearch({
  onPick,
  onCreateNew,
  onBack,
}: {
  onPick: (c: CustomerHit) => void
  onCreateNew: () => void
  onBack: () => void
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const [hits, setHits] = useState<CustomerHit[]>([])
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    const id = ++reqId.current
    if (debounced.trim().length < 2) {
      setHits([])
      return
    }
    setLoading(true)
    searchCustomers(debounced)
      .then((res) => {
        if (id === reqId.current) setHits(res.ok ? res.data : [])
      })
      .catch(() => toast.error('Suche fehlgeschlagen – keine Verbindung?'))
      .finally(() => id === reqId.current && setLoading(false))
  }, [debounced])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nachname, Firma oder Telefon"
          className="pl-9"
          aria-label="Kunden suchen"
        />
        {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {hits.length > 0 ? (
        <ul className="divide-y rounded-xl border">
          {hits.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className="flex w-full items-center gap-3 p-3 text-left active:bg-accent">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{c.place || 'Ohne Adresse'}</div>
                </div>
                {c.limited ? <Badge variant="muted" className="ml-auto">Bestandskunde</Badge> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : debounced.trim().length >= 2 && !loading ? (
        <p className="text-center text-sm text-muted-foreground">Kein Kunde gefunden.</p>
      ) : null}
      <Button type="button" variant="secondary" className="w-full" onClick={onCreateNew}>
        <UserPlus /> Neuen Kunden anlegen
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Zurück
      </Button>
    </div>
  )
}

interface NewCustomerFields {
  first_name: string
  last_name: string
  company_name: string
  billing_street: string
  billing_postal_code: string
  billing_city: string
  phone: string
}

const emptyCustomer: NewCustomerFields = {
  first_name: '',
  last_name: '',
  company_name: '',
  billing_street: '',
  billing_postal_code: '',
  billing_city: '',
  phone: '',
}

function NewCustomerForm({
  onCreated,
  onUseExisting,
  onBack,
}: {
  onCreated: (c: CustomerHit) => void
  onUseExisting: (c: CustomerHit) => void
  onBack: () => void
}) {
  const [f, setF] = useState<NewCustomerFields>(emptyCustomer)
  const [isCompany, setIsCompany] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([])
  const [pending, startTransition] = useTransition()
  const debounced = useDebounced(f, 500)

  useEffect(() => {
    if (!debounced.last_name && !debounced.company_name && debounced.phone.replace(/\D/g, '').length < 6) {
      setDuplicates([])
      return
    }
    checkDuplicates({
      first_name: debounced.first_name,
      last_name: debounced.last_name,
      company_name: debounced.company_name,
      phone: debounced.phone,
      postal_code: debounced.billing_postal_code,
    })
      .then((res) => setDuplicates(res.ok ? res.data : []))
      .catch(() => undefined)
  }, [debounced])

  const set = (key: keyof NewCustomerFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = () => {
    startTransition(async () => {
      try {
        const res = await createCustomer({
          customer: { ...f, company_name: isCompany ? f.company_name : null },
          service_location: null,
          service_location_if_complete: true,
        })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          toast.error(res.error)
          return
        }
        onCreated({
          id: res.data.id,
          customer_number: 0,
          name: isCompany && f.company_name ? f.company_name : [f.first_name, f.last_name].filter(Boolean).join(' '),
          place: [f.billing_postal_code, f.billing_city].filter(Boolean).join(' '),
          limited: false,
          locations: res.data.location_id
            ? [{ id: res.data.location_id, label: null, street: f.billing_street, postal_code: f.billing_postal_code, city: f.billing_city }]
            : [],
        })
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {[false, true].map((company) => (
          <button
            key={String(company)}
            type="button"
            onClick={() => setIsCompany(company)}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-md text-sm text-muted-foreground',
              isCompany === company && 'bg-background font-medium text-foreground shadow-sm',
            )}
          >
            {company ? <Building2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {company ? 'Firma' : 'Privat'}
          </button>
        ))}
      </div>
      {isCompany ? (
        <Field label="Firmenname" htmlFor="nc-company" error={errors['customer.last_name']}>
          <Input id="nc-company" value={f.company_name} onChange={set('company_name')} autoComplete="off" autoFocus />
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vorname" htmlFor="nc-first" optional>
          <Input id="nc-first" value={f.first_name} onChange={set('first_name')} autoComplete="off" />
        </Field>
        <Field label={isCompany ? 'Ansprechpartner' : 'Nachname'} htmlFor="nc-last" error={!isCompany ? errors['customer.last_name'] : undefined} optional={isCompany}>
          <Input id="nc-last" value={f.last_name} onChange={set('last_name')} autoComplete="off" autoFocus={!isCompany} />
        </Field>
      </div>
      <Field label="Straße und Hausnummer" htmlFor="nc-street" error={errors.billing_street} optional>
        <Input id="nc-street" value={f.billing_street} onChange={set('billing_street')} autoComplete="off" />
      </Field>
      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
        <Field label="PLZ" htmlFor="nc-plz" error={errors['customer.billing_postal_code']} optional>
          <Input id="nc-plz" value={f.billing_postal_code} onChange={set('billing_postal_code')} inputMode="numeric" maxLength={5} />
        </Field>
        <Field label="Ort" htmlFor="nc-city" optional>
          <Input id="nc-city" value={f.billing_city} onChange={set('billing_city')} />
        </Field>
      </div>
      <Field label="Telefon" htmlFor="nc-phone" optional>
        <Input id="nc-phone" value={f.phone} onChange={set('phone')} type="tel" inputMode="tel" />
      </Field>
      <p className="-mt-1 text-xs text-muted-foreground">
        Nur der Name ist nötig. Adresse und Telefon kann das Büro später ergänzen.
      </p>

      {duplicates.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" /> Diesen Kunden gibt es möglicherweise schon
          </p>
          {duplicates.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() =>
                onUseExisting({
                  id: d.id,
                  customer_number: d.customer_number,
                  name: d.display_name,
                  place: [d.postal_code, d.city].filter(Boolean).join(' '),
                  limited: true,
                  locations: d.einsatzorte,
                })
              }
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-background p-2.5 text-left text-sm active:bg-accent"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.display_name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[d.postal_code, d.city].filter(Boolean).join(' ')} · Treffer: {d.match_reason}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">Verwenden</span>
            </button>
          ))}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null} Kunde anlegen
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Zurück
      </Button>
    </form>
  )
}

function QuickJobForm({
  customer,
  onCreated,
  onBack,
}: {
  customer: CustomerHit
  onCreated: (job: JobOption) => void
  onBack: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<JobCategory>('kundendienst')
  const [locationId, setLocationId] = useState<string | null>(customer.locations[0]?.id ?? null)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      try {
        const res = await quickCreateJob({
          customer_id: customer.id,
          service_location_id: locationId,
          title: title.trim() || JOB_CATEGORY_LABELS[category],
          category,
        })
        if (!res.ok) {
          setError(res.fieldErrors?.title ?? res.error)
          return
        }
        onCreated(res.data)
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="rounded-xl bg-muted p-3">
        <div className="text-xs text-muted-foreground">Kunde</div>
        <div className="font-medium">{customer.name}</div>
        <div className="text-sm text-muted-foreground">{customer.place}</div>
      </div>

      {customer.locations.length > 1 ? (
        <Field label="Einsatzort">
          <div className="space-y-2">
            {customer.locations.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLocationId(l.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm',
                  locationId === l.id && 'border-primary bg-primary/5',
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {l.label ? <span className="font-medium">{l.label}: </span> : null}
                  {formatAddress(l)}
                </span>
              </button>
            ))}
          </div>
        </Field>
      ) : null}

      <Field label="Was ist zu tun?" htmlFor="qj-title" error={error} optional>
        <Input
          id="qj-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Wasserhahn austauschen"
          maxLength={200}
        />
      </Field>
      <Field label="Kategorie">
        <div className="flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'h-9 rounded-full border px-3 text-sm',
                category === c ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {JOB_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </Field>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null} Auftrag anlegen und auswählen
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Anderen Kunden wählen
      </Button>
    </form>
  )
}
