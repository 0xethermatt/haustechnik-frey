'use client'

import { useFormState } from 'react-dom'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { SubmitButton } from '@/components/ops/submit-button'
import { signIn, type AuthFormState } from '../auth-actions'

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useFormState<AuthFormState, FormData>(signIn, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      {linkError ? (
        <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">Der Link ist ungültig oder abgelaufen.</p>
      ) : null}
      <Field label="E-Mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus />
      </Field>
      <Field label="Passwort" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton variant="brand" className="w-full" size="lg" pendingLabel="Anmelden …">
        Anmelden
      </SubmitButton>
      <div className="text-center">
        <Link href="/intern/passwort-vergessen" className="text-sm font-medium text-[#6B2D8B] hover:underline">
          Passwort vergessen?
        </Link>
      </div>
    </form>
  )
}
