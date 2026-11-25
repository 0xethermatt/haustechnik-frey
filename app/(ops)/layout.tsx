import type { Metadata, Viewport } from 'next'
import './ops.css'
import { ThemeProvider } from '@/components/ops/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ServiceWorkerRegister } from '@/components/ops/service-worker-register'

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
          {children}
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
