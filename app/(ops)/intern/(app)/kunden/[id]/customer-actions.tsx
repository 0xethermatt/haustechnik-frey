'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { addServiceLocation, setCustomerArchived } from '../actions'

export function ArchiveCustomerButton({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!archived && !confirm('Kunde archivieren? Historische Aufträge und Berichte bleiben erhalten.')) return
          const res = await setCustomerArchived(id, !archived).catch(() => null)
          if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
          toast.success(archived ? 'Kunde wiederhergestellt' : 'Kunde archiviert')
          router.refresh()
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : archived ? <ArchiveRestore /> : <Archive />}
      {archived ? 'Wiederherstellen' : 'Archivieren'}
    </Button>
  )
}

export function AddLocationSheet({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ label: '', street: '', postal_code: '', city: '', access_notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MapPin /> Einsatzort
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Einsatzort hinzufügen">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              start(async () => {
                const res = await addServiceLocation(customerId, v).catch(() => null)
                if (!res) return void toast.error('Keine Verbindung.')
                if (!res.ok) {
                  setErrors(res.fieldErrors ?? {})
                  return void toast.error(res.error)
                }
                toast.success('Einsatzort gespeichert')
                setOpen(false)
                setV({ label: '', street: '', postal_code: '', city: '', access_notes: '' })
                router.refresh()
              })
            }}
          >
            <Field label="Bezeichnung" optional htmlFor="sl-label">
              <Input id="sl-label" value={v.label} onChange={set('label')} placeholder="z. B. Objekt Kantstraße" />
            </Field>
            <Field label="Straße und Hausnummer" htmlFor="sl-street" error={errors.street}>
              <Input id="sl-street" value={v.street} onChange={set('street')} />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="PLZ" htmlFor="sl-plz" error={errors.postal_code}>
                <Input id="sl-plz" value={v.postal_code} onChange={set('postal_code')} inputMode="numeric" maxLength={5} />
              </Field>
              <Field label="Ort" htmlFor="sl-city" error={errors.city}>
                <Input id="sl-city" value={v.city} onChange={set('city')} />
              </Field>
            </div>
            <Field label="Zugangshinweise" optional htmlFor="sl-notes">
              <Input id="sl-notes" value={v.access_notes} onChange={set('access_notes')} placeholder="z. B. Heizraum im UG" />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Speichern
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
