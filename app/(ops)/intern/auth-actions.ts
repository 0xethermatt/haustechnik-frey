'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/ops/supabase/server'
import { loginErrorMessage, type AuthErrorLike } from '@/lib/ops/auth-errors'

export interface AuthFormState {
  error?: string
  message?: string
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/intern') && !next.startsWith('//') ? next : '/intern'
}

const credentials = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
})

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Bitte E-Mail und Passwort eingeben.' }
  let error: AuthErrorLike | null = null
  let mustChangePassword = false
  try {
    const supabase = createClient()
    const res = await supabase.auth.signInWithPassword(parsed.data)
    error = res.error
    mustChangePassword = res.data.user?.user_metadata?.must_change_password === true
  } catch (e) {
    error = { name: 'ClientSetupError', message: e instanceof Error ? e.message : String(e) }
  }
  if (error) {
    // Ursache ins Server-Protokoll (ohne E-Mail-Adresse/Passwort), damit sie in Vercel → Logs sichtbar ist
    console.error('[login]', JSON.stringify({ code: error.code, status: error.status, name: error.name, message: error.message }))
    return { error: loginErrorMessage(error) }
  }
  redirect(mustChangePassword ? '/intern/passwort' : safeNext(formData.get('next')))
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/intern/login')
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z.email().safeParse(String(formData.get('email') ?? '').trim().toLowerCase())
  if (!parsed.success) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' }
  const supabase = createClient()
  const origin = headers().get('origin') ?? ''
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/intern/auth/confirm?next=/intern/passwort`,
  })
  // Gleiche Antwort unabhängig davon, ob das Konto existiert.
  return { message: 'Falls ein Konto existiert, wurde eine E-Mail mit einem Link versendet.' }
}

const newPassword = z
  .object({ password: z.string().min(10, 'Mindestens 10 Zeichen.'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Die Passwörter stimmen nicht überein.' })

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPassword.safeParse({ password: formData.get('password'), confirm: formData.get('confirm') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Der Link ist abgelaufen. Bitte erneut anfordern.' }
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { must_change_password: false },
  })
  if (error) return { error: error.code === 'same_password' ? 'Bitte ein neues Passwort wählen.' : 'Passwort konnte nicht gespeichert werden.' }
  redirect('/intern')
}
