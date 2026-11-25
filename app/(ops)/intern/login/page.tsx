import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/ops/auth-card'
import { getSessionContext } from '@/lib/ops/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Anmelden' }

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; fehler?: string } }) {
  const ctx = await getSessionContext()
  if (ctx) redirect('/intern')
  return (
    <AuthCard title="Anmelden" description="Zugang nur für Mitarbeitende von Frey Haustechnik">
      <LoginForm next={searchParams.next} linkError={searchParams.fehler === 'link'} />
    </AuthCard>
  )
}
