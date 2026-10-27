import Image from 'next/image'

interface Brand {
  name: string
  category: string
  logo: string
}

const brands: Brand[] = [
  { name: 'Viessmann', category: 'Heizung', logo: '/images/logos/viessmann.jpg' },
  { name: 'Vaillant', category: 'Heizung', logo: '/images/logos/vaillant.png' },
  { name: 'Buderus', category: 'Heizung', logo: '/images/logos/buderus.png' },
  { name: 'Weishaupt', category: 'Heizung', logo: '/images/logos/weishaupt.png' },
  { name: 'Grohe', category: 'Sanitär', logo: '/images/logos/grohe.png' },
  { name: 'Hansgrohe', category: 'Sanitär', logo: '/images/logos/hansgrohe.jpg' },
  { name: 'Hansa', category: 'Sanitär', logo: '/images/logos/hansa.jpg' },
  { name: 'Geberit', category: 'Sanitär', logo: '/images/logos/geberit.png' },
  { name: 'Villeroy & Boch', category: 'Badkeramik', logo: '/images/logos/villeroy-boch.png' },
  { name: 'Duravit', category: 'Badkeramik', logo: '/images/logos/duravit.png' },
  { name: 'Laufen', category: 'Badkeramik', logo: '/images/logos/laufen.png' },
  { name: 'Kermi', category: 'Heizkörper', logo: '/images/logos/kermi.png' },
]

function LogoReihe({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className={`flex flex-shrink-0 items-center gap-4 pr-4 ${ariaHidden ? 'motion-reduce:hidden' : ''}`}
      aria-hidden={ariaHidden || undefined}
      role="list"
    >
      {brands.map((brand) => (
        <li
          key={brand.name}
          className="flex items-center justify-center w-36 sm:w-44 h-20 sm:h-24 bg-white rounded-2xl border border-brand-purple/10 px-5 flex-shrink-0"
        >
          <div className="relative w-full h-10 sm:h-12">
            <Image
              src={brand.logo}
              alt={ariaHidden ? '' : `${brand.name} Logo`}
              fill
              className="object-contain"
              sizes="176px"
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Markenpartner() {
  return (
    <section id="markenpartner" className="py-12 sm:py-16 bg-brand-cream overflow-hidden" aria-labelledby="markenpartner-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-3">
          Unsere Partner
        </span>
        <h2 id="markenpartner-heading" className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep">
          Wir verbauen ausschließlich Markenqualität
        </h2>
      </div>

      {/* Endlos-Band: zwei identische Reihen, die um genau eine Reihenbreite verschoben werden */}
      <div className="group relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
          <LogoReihe />
          <LogoReihe ariaHidden />
        </div>
      </div>
    </section>
  )
}
