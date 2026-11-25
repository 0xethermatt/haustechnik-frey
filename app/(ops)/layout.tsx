import type { Metadata, Viewport } from 'next'
import './ops.generated.css'
import { ThemeProvider } from '@/components/ops/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ServiceWorkerRegister } from '@/components/ops/service-worker-register'
import { isSupabaseConfigured } from '@/lib/ops/supabase/env'

export const metadata: Metadata = {
  title: { default: 'Frey Betrieb', template: '%s · Frey Betrieb' },
  description: 'Interne Betriebsplattform von Frey Haustechnik',
  robots: { index: false, follow: false, nocache: true },
  manifest: '/intern/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Frey Betrieb', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/intern/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/intern/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#130f16' },
  ],
}

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {isSupabaseConfigured() ? children : <NotConfigured />}
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}

/** Hinweis statt Fehlerseite, solange die Datenbank-Zugangsdaten in Vercel fehlen. */
function NotConfigured() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="max-w-sm rounded-2xl border bg-background p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">F</div>
        <h1 className="text-lg font-semibold">Noch nicht eingerichtet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Die Betriebsplattform ist installiert, aber noch nicht mit der Datenbank verbunden. Es fehlen die Supabase-Zugangsdaten in
          den Vercel-Einstellungen.
        </p>
      </div>
    </div>
  )
}
