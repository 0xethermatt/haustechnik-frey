import { describe, expect, it } from 'vitest'
import { loginErrorMessage } from '@/lib/ops/auth-errors'

describe('Anmeldefehler', () => {
  it('„falsch“ nur bei ungültigen Zugangsdaten', () => {
    expect(loginErrorMessage({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' })).toBe('E-Mail oder Passwort ist falsch.')
    expect(loginErrorMessage({ message: 'Invalid login credentials' })).toBe('E-Mail oder Passwort ist falsch.')
  })

  it('unterscheidet Konto-Zustände', () => {
    expect(loginErrorMessage({ code: 'email_not_confirmed' })).toMatch(/noch nicht bestätigt/)
    expect(loginErrorMessage({ code: 'user_banned' })).toMatch(/gesperrt/)
    expect(loginErrorMessage({ status: 429 })).toMatch(/Zu viele Versuche/)
  })

  it('erkennt Einrichtungsfehler und führt sie nicht als Tippfehler', () => {
    expect(loginErrorMessage({ code: 'email_provider_disabled', message: 'Email logins are disabled' })).toMatch(/ausgeschaltet/)
    expect(loginErrorMessage({ status: 401, message: 'Invalid API key' })).toMatch(/API-Schlüssel/)
    expect(loginErrorMessage({ name: 'AuthRetryableFetchError', status: 0, message: 'fetch failed' })).toMatch(/Supabase-Adresse/)
    expect(loginErrorMessage({ name: 'ClientSetupError', message: 'Invalid URL' })).toMatch(/Supabase-Adresse/)
    expect(loginErrorMessage({ code: 'something_new' })).not.toMatch(/falsch/)
  })
})
