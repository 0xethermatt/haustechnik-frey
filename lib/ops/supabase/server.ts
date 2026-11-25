import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from './env'

/** Supabase-Client mit der Sitzung des angemeldeten Benutzers – RLS gilt. */
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // In Server Components nicht setzbar – die Middleware aktualisiert die Sitzung.
        }
      },
    },
  })
}

export type ServerSupabase = ReturnType<typeof createClient>
