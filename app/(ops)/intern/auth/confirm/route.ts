import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/ops/supabase/server'

const ALLOWED: EmailOtpType[] = ['invite', 'recovery', 'email', 'email_change']

/** Bestätigt Einladungs- und Passwort-Links (token_hash) und meldet den Benutzer an. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/intern'
  const next = nextParam.startsWith('/intern') && !nextParam.startsWith('//') ? nextParam : '/intern'

  const target = request.nextUrl.clone()
  target.search = ''

  if (tokenHash && type && ALLOWED.includes(type)) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      target.pathname = next
      return NextResponse.redirect(target)
    }
  }

  target.pathname = '/intern/login'
  target.searchParams.set('fehler', 'link')
  return NextResponse.redirect(target)
}
