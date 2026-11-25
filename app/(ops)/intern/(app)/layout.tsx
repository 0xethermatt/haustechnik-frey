import { AppShell } from '@/components/ops/app-shell'
import { navItemsFor } from '@/components/ops/nav-items'
import { requireSession } from '@/lib/ops/auth'
import { APP_ROLE_LABELS } from '@/lib/ops/domain/labels'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession()
  const name = ctx.profile.display_name || ctx.email
  const roleLabel = ctx.roles.map((r) => APP_ROLE_LABELS[r]).join(' · ')
  return (
    <AppShell items={navItemsFor(ctx)} userName={name} roleLabel={roleLabel}>
      {children}
    </AppShell>
  )
}
