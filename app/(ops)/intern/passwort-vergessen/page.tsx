'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthCard } from '@/components/ops/auth-card'
import { SubmitButton } from '@/components/ops/submit-button'
import { requestPasswordReset, type AuthFormState } from '../auth-actions'

export default function ForgotPasswordPage() {
  const [state, action] = useFormState<AuthFormState, FormData>(requestPasswordReset, {})
  return (
    <AuthCard title="Passwort vergessen" description="Wir senden Ihnen einen Link zum Zurücksetzen.">
      {state.message ? (
        <p className="text-sm">{state.message}</p>
      ) : (
        <form action={action} className="space-y-4">
          <Field label="E-Mail" htmlFor="email" error={state.error}>
            <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </Field>
          <SubmitButton className="w-full" size="lg" pendingLabel="Wird gesendet …">
            Link senden
          </SubmitButton>
        </form>
      )}
      <div className="mt-4 text-center">
        <Link href="/intern/login" className="text-sm text-muted-foreground hover:text-foreground">
          Zurück zur Anmeldung
        </Link>
      </div>
    </AuthCard>
  )
}
