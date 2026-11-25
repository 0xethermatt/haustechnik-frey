import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl } from './env'

/**
 * Service-Role-Client – umgeht RLS. Ausschließlich serverseitig und nur für
 * Auth-Administration (Einladungen) verwenden, NIE für Fachdaten.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt.')
  return createClient(supabaseUrl(), key, { auth: { autoRefreshToken: false, persistSession: false } })
}
