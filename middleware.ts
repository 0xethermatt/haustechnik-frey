import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/ops/supabase/middleware'

export function middleware(request: NextRequest) {
  return updateSession(request)
}

// Nur die interne Plattform – die öffentliche Website bleibt unberührt.
// Statische Dateien unter /intern (Manifest, Service Worker, Icons) sind ausgenommen.
export const config = {
  matcher: ['/intern', '/intern/((?!sw\\.js|manifest\\.webmanifest|icons/|offline\\.html).*)'],
}
