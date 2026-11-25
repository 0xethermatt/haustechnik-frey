import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, KeyRound, Plus } from 'lucide-react'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { EMPLOYMENT_ROLE_LABELS } from '@/lib/ops/domain/labels'
import { formatMinutes } from '@/lib/ops/domain/time'
import type { Employee } from '@/lib/ops/domain/types'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/ops/utils'

export const metadata: Metadata = { title: 'Mitarbeiter' }

export default async function EmployeesPage() {
  await requireOffice()
  const supabase = createClient()
  const { data } = await supabase.from('mitarbeiter').select('*').order('is_active', { ascending: false }).order('last_name')
  const employees = (data ?? []) as Employee[]
  return (
    <>
      <PageHeader
        title="Mitarbeiter"
        description={`${employees.filter((e) => e.is_active).length} aktiv`}
        actions={
          <Button asChild>
            <Link href="/intern/mitarbeiter/neu">
              <Plus /> Mitarbeiter
            </Link>
          </Button>
        }
      />
      <PageBody>
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {employees.map((e) => (
            <li key={e.id}>
              <Link href={`/intern/mitarbeiter/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {fullName(e)}
                    {e.profile_id ? <KeyRound className="h-3.5 w-3.5 text-muted-foreground" aria-label="Hat Zugang" /> : null}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nr. {e.employee_number} · {EMPLOYMENT_ROLE_LABELS[e.employment_role]} · {formatMinutes(e.weekly_target_minutes)}/Woche
                  </div>
                </div>
                {!e.is_active ? <Badge variant="muted">Inaktiv</Badge> : null}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </PageBody>
    </>
  )
}
