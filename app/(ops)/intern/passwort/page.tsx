'use client'

import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthCard } from '@/components/ops/auth-card'
import { SubmitButton } from '@/components/ops/submit-button'
import { updatePassword, type AuthFormState } from '../auth-actions'

export default function SetPasswordPage() {
  const [state, action] = useFormState<AuthFormState, FormData>(updatePassword, {})
  return (
    <AuthCard title="Passwort festlegen" description="Mindestens 10 Zeichen. Am besten ein Satz, den Sie sich merken können.">
      <form action={action} className="space-y-4">
        <Field label="Neues Passwort" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus />
        </Field>
        <Field label="Passwort wiederholen" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
        </Field>
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <SubmitButton className="w-full" size="lg" pendingLabel="Wird gespeichert …">
          Passwort speichern
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
