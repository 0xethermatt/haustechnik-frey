'use client'

interface LogoProps {
  size?: number
  withText?: boolean
  textColor?: string
  className?: string
}

export default function Logo({
  size = 48,
  withText = true,
  textColor = '#FFFFFF',
  className = '',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG House Logo — nachgebaut nach Firmenlogo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Haustechnik Frey Logo"
      >
        {/* Haus-Umriss in Lila */}
        <path
          d="M50 8 L92 42 L92 88 L62 88 L62 68 L38 68 L38 88 L8 88 L8 42 Z"
          fill="none"
          stroke="#6B2D8B"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Flamme (Orange) — leicht links */}
        <path
          d="M36 72 C36 72 28 64 30 54 C30 54 33 60 36 58 C36 58 33 50 38 44 C38 44 38 52 42 54 C42 54 46 48 44 40 C44 40 52 50 50 60 C50 60 54 56 52 50 C52 50 58 58 54 68 C54 68 52 72 44 74 C36 76 32 72 36 72 Z"
          fill="#E8A030"
        />
        {/* Wassertropfen (Blau) — rechts */}
        <path
          d="M66 44 C66 44 58 56 58 63 C58 67.4 61.6 71 66 71 C70.4 71 74 67.4 74 63 C74 56 66 44 66 44 Z"
          fill="#5B8EC9"
        />
      </svg>

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
