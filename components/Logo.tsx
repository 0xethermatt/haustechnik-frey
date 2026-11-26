'use client'

interface LogoProps {
  size?: number
  withText?: boolean
  textColor?: string
  className?: string
  /** Weiße Plakette hinter dem Logo – nötig auf dunklem Grund, weil der Rahmen des Logos dunkellila ist */
  badge?: boolean
}

/**
 * Firmenlogo: public/logo-mark.svg ist eine exakte Vektor-Nachzeichnung der Original-Datei
 * (Images/Logo/Logo.png, Vorlage der Fahrzeugbeschriftung) – siehe scripts/logo/trace_logo.py.
 */
export default function Logo({
  size = 48,
  withText = true,
  textColor = '#FFFFFF',
  className = '',
  badge = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        data-logo-mark
        className={`flex shrink-0 items-center justify-center ${badge ? 'rounded-xl bg-white shadow-sm' : ''}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.svg"
          alt="Haustechnik Frey Logo"
          width={Math.round(size * (badge ? 0.7 : 1) * 0.88)}
          height={Math.round(size * (badge ? 0.7 : 1))}
          style={{ width: 'auto', height: badge ? '70%' : '100%' }}
        />
      </span>

      {withText && (
        <div className="flex flex-col leading-tight">
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: textColor, opacity: 0.75, fontFamily: 'var(--font-dm-sans)' }}
          >
            Haustechnik
          </span>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: textColor, fontFamily: 'var(--font-playfair)' }}
          >
            Frey
          </span>
        </div>
      )}
    </div>
  )
}
