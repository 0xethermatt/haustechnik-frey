import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { APP_ROLE_LABELS } from '@/lib/ops/domain/labels'
import type { AppRole } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { Badge } from '@/components/ui/badge'
import { fullName } from '@/lib/ops/utils'
import { CreateUserSheet, EditAccessSheet, InviteUserSheet } from './user-access'

export const metadata: Metadata = { title: 'Zugänge' }

export default async function UsersPage() {
  await requireAdmin()
  const supabase = createClient()
  const [{ data: profiles }, { data: employees }] = await Promise.all([
    supabase.from('benutzerprofile').select('id, email, display_name, roles, is_active, created_at').order('display_name'),
    supabase.from('mitarbeiter').select('id, first_name, last_name, profile_id, is_active').order('last_name'),
  ])
  const options = (employees ?? [])
    .filter((e) => e.is_active)
    .map((e) => ({ id: e.id, name: fullName(e), linked: !!e.profile_id }))

  return (
    <>
      <PageHeader
        title="Zugänge"
        description="Nur eingeladene Personen können sich anmelden. Rollen werden in der Datenbank geprüft."
        actions={
          <div className="flex gap-2">
            <CreateUserSheet employees={options} />
            <InviteUserSheet employees={options} />
          </div>
        }
      />
      <PageBody>
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {(profiles ?? []).map((p) => {
            const employee = (employees ?? []).find((e) => e.profile_id === p.id)
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {p.display_name || p.email}
                    {!p.is_active ? <Badge variant="destructive">Deaktiviert</Badge> : null}
                    {!p.roles.length ? <Badge variant="warning">Keine Rolle</Badge> : null}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {p.email}
                    {employee ? ` · Mitarbeiter: ${fullName(employee)}` : ''}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(p.roles as AppRole[]).map((r) => (
                      <Badge key={r} variant="secondary">
                        {APP_ROLE_LABELS[r]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <EditAccessSheet
                  user={{ id: p.id, display_name: p.display_name, roles: p.roles as AppRole[], is_active: p.is_active, employee_id: employee?.id ?? null }}
                  employees={options}
                />
              </li>
            )
          })}
        </ul>
      </PageBody>
    </>
  )
}
