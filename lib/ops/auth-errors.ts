export interface AuthErrorLike {
  status?: number
  code?: string
  name?: string
  message?: string
}

/**
 * Übersetzt Anmeldefehler in eine verständliche Meldung. „Falsches Passwort“ wird nur gezeigt,
 * wenn Supabase wirklich ungültige Zugangsdaten meldet – Einrichtungsfehler sollen nicht
 * wie ein Tippfehler aussehen.
 */
export function loginErrorMessage(error: AuthErrorLike): string {
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()

  if (error.status === 429 || code === 'over_request_rate_limit') return 'Zu viele Versuche. Bitte kurz warten.'
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-Mail oder Passwort ist falsch.'
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Diese E-Mail-Adresse ist noch nicht bestätigt. Bitte beim Büro melden.'
  }
  if (code === 'user_banned') return 'Dieser Zugang ist gesperrt. Bitte beim Büro melden.'
  if (code === 'email_provider_disabled' || message.includes('email logins are disabled')) {
    return 'Die Anmeldung per E-Mail ist in Supabase ausgeschaltet (Authentication → Sign In / Providers → Email). Bitte den Administrator informieren.'
  }
  if (message.includes('api key') || code === 'no_authorization' || code === 'bad_jwt') {
    return 'Die Verbindung zur Datenbank ist falsch eingerichtet (API-Schlüssel in Vercel prüfen). Bitte den Administrator informieren.'
  }
  if (
    error.name === 'AuthRetryableFetchError' ||
    error.status === 0 ||
    (error.status !== undefined && error.status >= 500) ||
    message.includes('fetch failed') ||
    message.includes('invalid url')
  ) {
    return 'Der Server ist gerade nicht erreichbar oder falsch eingerichtet (Supabase-Adresse in Vercel prüfen). Bitte später erneut versuchen.'
  }
  return 'Anmeldung fehlgeschlagen. Bitte den Administrator informieren.'
}
