'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { APP_ROLE_LABELS } from '@/lib/ops/domain/labels'
import type { AppRole } from '@/lib/ops/domain/types'
import { cn } from '@/lib/ops/utils'
import { inviteUser, setUserAccess } from './actions'

const ROLES: { role: AppRole; hint: string }[] = [
  { role: 'employee', hint: 'Eigene Aufträge, Berichte und Zeiten' },
  { role: 'office', hint: 'Kunden, Aufträge, Prüfung, alle Zeiten' },
  { role: 'admin', hint: 'Zusätzlich Zugänge und Rollen verwalten' },
]

interface EmployeeOption {
  id: string
  name: string
  linked: boolean
}

function RolePicker({ roles, onChange }: { roles: AppRole[]; onChange: (r: AppRole[]) => void }) {
  return (
    <div className="space-y-2">
      {ROLES.map(({ role, hint }) => {
        const checked = roles.includes(role)
        return (
          <label key={role} className={cn('flex items-center gap-3 rounded-lg border p-3 text-sm', checked && 'border-primary bg-primary/5')}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[hsl(var(--primary))]"
              checked={checked}
              onChange={() => onChange(checked ? roles.filter((r) => r !== role) : [...roles, role])}
            />
            <span>
              <span className="block font-medium">{APP_ROLE_LABELS[role]}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function InviteUserSheet({ employees }: { employees: EmployeeOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ email: '', display_name: '', roles: ['employee'] as AppRole[], employee_id: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Mail /> Einladen
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Zugang einladen" description="Die Person erhält eine E-Mail und legt ihr Passwort selbst fest.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              start(async () => {
                const res = await inviteUser({ ...v, employee_id: v.employee_id || null }).catch(() => null)
                if (!res) return void toast.error('Keine Verbindung.')
                if (!res.ok) {
                  setErrors(res.fieldErrors ?? {})
                  return void toast.error(res.error)
                }
                toast.success('Einladung versendet')
                setOpen(false)
                setV({ email: '', display_name: '', roles: ['employee'], employee_id: '' })
                router.refresh()
              })
            }}
          >
            <Field label="Name" htmlFor="i-name" error={errors.display_name}>
              <Input id="i-name" value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} />
            </Field>
            <Field label="E-Mail" htmlFor="i-email" error={errors.email}>
              <Input id="i-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            </Field>
            <Field label="Rollen" error={errors.roles}>
              <RolePicker roles={v.roles} onChange={(roles) => setV({ ...v, roles })} />
            </Field>
            <Field label="Mitarbeiterdatensatz" htmlFor="i-emp" optional hint="Für Mitarbeiter erforderlich, damit Zeiten zugeordnet werden">
              <NativeSelect id="i-emp" value={v.employee_id} onChange={(e) => setV({ ...v, employee_id: e.target.value })}>
                <option value="">Keiner</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id} disabled={e.linked}>
                    {e.name}
                    {e.linked ? ' (bereits verknüpft)' : ''}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Einladung senden
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function EditAccessSheet({
  user,
  employees,
}: {
  user: { id: string; display_name: string; roles: AppRole[]; is_active: boolean; employee_id: string | null }
  employees: EmployeeOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState(user)
  const [pending, start] = useTransition()

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => { setV(user); setOpen(true) }} aria-label={`${user.display_name} bearbeiten`}>
        <Pencil />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Zugang bearbeiten" description={user.display_name}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              start(async () => {
                const res = await setUserAccess({
                  user_id: v.id,
                  roles: v.roles,
                  is_active: v.is_active,
                  display_name: v.display_name,
                  employee_id: v.employee_id || null,
                }).catch(() => null)
                if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
                toast.success('Zugang gespeichert')
                setOpen(false)
                router.refresh()
              })
            }}
          >
            <Field label="Name" htmlFor="u-name">
              <Input id="u-name" value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} />
            </Field>
            <Field label="Rollen">
              <RolePicker roles={v.roles} onChange={(roles) => setV({ ...v, roles })} />
            </Field>
            <Field label="Mitarbeiterdatensatz" htmlFor="u-emp" optional>
              <NativeSelect id="u-emp" value={v.employee_id ?? ''} onChange={(e) => setV({ ...v, employee_id: e.target.value || null })}>
                <option value="">Keiner</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id} disabled={e.linked && e.id !== user.employee_id}>
                    {e.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />
              Zugang aktiv
            </label>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Speichern
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
