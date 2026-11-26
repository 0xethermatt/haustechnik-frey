import Logo from '@/components/Logo'

/**
 * Anmelde-Rahmen im Design der Website: Lila-Verlauf, Firmenlogo, weiße Karte,
 * orange Hauptknopf. Die Karte bleibt auch im Dunkelmodus hell (wie die Website).
 */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #2D1140 0%, #6B2D8B 100%)', fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size={60} withText textColor="#FFFFFF" />
        </div>
        <div className="auth-light rounded-3xl p-6 shadow-[0_12px_40px_rgba(20,6,30,0.45)] md:p-7">
          <h1 className="text-xl font-bold tracking-tight text-[#2D1140]">{title}</h1>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-white/60">Frey Haustechnik · Interne Betriebsplattform</p>
      </div>
    </div>
  )
}
