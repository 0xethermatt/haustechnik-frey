'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { checkDuplicates, createCustomer, updateCustomer, type DuplicateHit } from '@/app/(ops)/intern/(app)/kunden/actions'

export interface CustomerFormValues {
  first_name: string
  last_name: string
  company_name: string
  edison_customer_number: string
  billing_street: string
  billing_postal_code: string
  billing_city: string
  phone: string
  email: string
  notes: string
}

export const emptyCustomerValues: CustomerFormValues = {
  first_name: '',
  last_name: '',
  company_name: '',
  edison_customer_number: '',
  billing_street: '',
  billing_postal_code: '',
  billing_city: '',
  phone: '',
  email: '',
  notes: '',
}

export function CustomerForm({ customerId, initial, canEditNumbers }: { customerId?: string; initial: CustomerFormValues; canEditNumbers: boolean }) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [loc, setLoc] = useState({ label: '', street: '', postal_code: '', city: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([])
  const [pending, start] = useTransition()
  const isNew = !customerId

  useEffect(() => {
    if (!isNew) return
    const t = setTimeout(() => {
      if (!v.last_name && !v.company_name && !v.email && v.phone.replace(/\D/g, '').length < 6) return setDuplicates([])
      checkDuplicates({
        first_name: v.first_name,
        last_name: v.last_name,
        company_name: v.company_name,
        phone: v.phone,
        email: v.email,
        postal_code: v.billing_postal_code,
      })
        .then((res) => setDuplicates(res.ok ? res.data : []))
        .catch(() => undefined)
    }, 500)
    return () => clearTimeout(t)
  }, [isNew, v.first_name, v.last_name, v.company_name, v.phone, v.email, v.billing_postal_code])

  const set = (key: keyof CustomerFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [key]: e.target.value }))
  const err = (key: string) => errors[`customer.${key}`] ?? errors[key]

  const submit = () =>
    start(async () => {
      try {
        if (isNew) {
          const res = await createCustomer({
            customer: v,
            service_location_same_as_billing: sameAsBilling,
            service_location: sameAsBilling || !loc.street ? null : loc,
          })
          if (!res.ok) {
            setErrors(res.fieldErrors ?? {})
            return void toast.error(res.error)
          }
          toast.success('Kunde angelegt')
          router.push(`/intern/kunden/${res.data.id}`)
        } else {
          const res = await updateCustomer(customerId, v)
          if (!res.ok) {
            setErrors(res.fieldErrors ?? {})
            return void toast.error(res.error)
          }
          toast.success('Gespeichert')
          router.push(`/intern/kunden/${customerId}`)
        }
        router.refresh()
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Vorname" htmlFor="c-first" optional>
            <Input id="c-first" value={v.first_name} onChange={set('first_name')} />
          </Field>
          <Field label="Nachname" htmlFor="c-last" error={err('last_name')}>
            <Input id="c-last" value={v.last_name} onChange={set('last_name')} />
          </Field>
          <Field label="Firma" htmlFor="c-company" optional className="md:col-span-2">
            <Input id="c-company" value={v.company_name} onChange={set('company_name')} />
          </Field>
          <Field label="Telefon" htmlFor="c-phone" optional>
            <Input id="c-phone" type="tel" value={v.phone} onChange={set('phone')} />
          </Field>
          <Field label="E-Mail" htmlFor="c-email" optional error={err('email')}>
            <Input id="c-email" type="email" value={v.email} onChange={set('email')} />
          </Field>
          {canEditNumbers ? (
            <Field label="Edison-Kundennummer" htmlFor="c-edison" optional hint="Kundennummer aus Edison Handwerk">
              <Input id="c-edison" value={v.edison_customer_number} onChange={set('edison_customer_number')} />
            </Field>
          ) : null}
        </CardContent>
      </Card>

      {duplicates.length ? (
        <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" /> Mögliche Dubletten gefunden
          </p>
          <ul className="space-y-1 text-sm">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link href={`/intern/kunden/${d.id}`} className="font-medium hover:underline" target="_blank">
                  {d.display_name}
                </Link>{' '}
                <span className="text-muted-foreground">
                  · {[d.postal_code, d.city].filter(Boolean).join(' ')} · Treffer: {d.match_reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Rechnungsadresse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_8rem_1fr]">
          <Field label="Straße und Hausnummer" htmlFor="c-street" error={err('billing_street')}>
            <Input id="c-street" value={v.billing_street} onChange={set('billing_street')} />
          </Field>
          <Field label="PLZ" htmlFor="c-plz" error={err('billing_postal_code')}>
            <Input id="c-plz" inputMode="numeric" maxLength={5} value={v.billing_postal_code} onChange={set('billing_postal_code')} />
          </Field>
          <Field label="Ort" htmlFor="c-city">
            <Input id="c-city" value={v.billing_city} onChange={set('billing_city')} />
          </Field>
        </CardContent>
      </Card>

      {isNew ? (
        <Card>
          <CardHeader>
            <CardTitle>Einsatzort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
              Wie Rechnungsadresse
            </label>
            {!sameAsBilling ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Bezeichnung" optional htmlFor="l-label" hint="z. B. Ferienwohnung, Objekt Kantstraße">
                  <Input id="l-label" value={loc.label} onChange={(e) => setLoc({ ...loc, label: e.target.value })} />
                </Field>
                <Field label="Straße und Hausnummer" htmlFor="l-street" error={errors['service_location.street']}>
                  <Input id="l-street" value={loc.street} onChange={(e) => setLoc({ ...loc, street: e.target.value })} />
                </Field>
                <Field label="PLZ" htmlFor="l-plz" error={errors['service_location.postal_code']}>
                  <Input id="l-plz" inputMode="numeric" maxLength={5} value={loc.postal_code} onChange={(e) => setLoc({ ...loc, postal_code: e.target.value })} />
                </Field>
                <Field label="Ort" htmlFor="l-city" error={errors['service_location.city']}>
                  <Input id="l-city" value={loc.city} onChange={(e) => setLoc({ ...loc, city: e.target.value })} />
                </Field>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Interne Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={v.notes} onChange={set('notes')} placeholder="z. B. Schlüssel beim Nachbarn, Hund im Garten" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? <Loader2 className="animate-spin" /> : null}
          {isNew ? 'Kunde anlegen' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}
