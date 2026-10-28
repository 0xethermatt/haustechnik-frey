import Image from 'next/image'
import { Quote } from 'lucide-react'
import { REFERENZ, referenzVorhanden } from '@/lib/waermepumpe/referenz'

// sm: zwei kleine, ein breites, zwei kleine (grid-flow-dense füllt die Lücke)
// lg (4 Spalten): Hochformat links und rechts über zwei Reihen, dazwischen ein breites und zwei kleine Bilder
const KACHEL = [
  'lg:row-span-2',
  'sm:col-span-2',
  '',
  '',
  'lg:row-span-2 lg:col-start-4 lg:row-start-1',
]

export default function WPReferenz() {
  const { titel, einleitung, fakten, bilder, schritte, zitat } = REFERENZ
  if (!referenzVorhanden) return null

  return (
    <section id="referenz" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-white" aria-labelledby="referenz-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8 sm:mb-10">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Aus unserer Praxis
          </span>
          <h2 id="referenz-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight mb-4">
            {titel}
          </h2>
          <p className="text-base sm:text-lg text-brand-purple-deep/70 leading-relaxed">{einleitung}</p>
        </div>

        {fakten.length > 0 && (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {fakten.map((f) => (
              <div key={f.label} className="bg-brand-cream rounded-2xl px-4 py-3 border border-brand-purple/10">
                <dt className="text-xs text-brand-purple-deep/50">{f.label}</dt>
                <dd className="font-bold text-brand-purple-deep text-sm sm:text-base">{f.wert}</dd>
              </div>
            ))}
          </dl>
        )}

        {bilder.length > 0 && (
          <div
            className="flex sm:grid sm:grid-flow-dense sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:h-[600px] gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Fotos vom Projekt"
          >
            {bilder.map((b, i) => (
              <figure
                key={b.src}
                role="listitem"
                className={`group relative w-[85%] flex-shrink-0 snap-center sm:w-auto aspect-[4/3] lg:aspect-auto rounded-3xl overflow-hidden bg-brand-cream ${KACHEL[i] ?? ''}`}
              >
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  sizes={i === 1 ? '(max-width: 640px) 85vw, (max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw'}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-brand-purple-deep/85 via-brand-purple-deep/40 to-transparent text-white">
                  <p className="font-bold">{b.titel}</p>
                  <p className="text-sm text-white/80 leading-snug">{b.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {schritte.length > 0 && (
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10" role="list">
            {schritte.map((s, i) => (
              <li key={s.bild} className="rounded-3xl overflow-hidden border border-brand-purple/10 bg-brand-cream flex flex-col">
                <div className="relative aspect-[4/3]">
                  <Image src={s.bild} alt={s.bildAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                  <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-brand-purple-deep mb-1">{s.titel}</h3>
                  <p className="text-sm text-brand-purple-deep/65 leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {zitat && (
          <figure className="mt-10 rounded-3xl bg-brand-purple-deep text-white p-6 sm:p-8 flex gap-4">
            <Quote className="w-8 h-8 text-brand-orange flex-shrink-0" aria-hidden="true" />
            <div>
              <blockquote className="text-lg sm:text-xl leading-relaxed">„{zitat.text}“</blockquote>
              <figcaption className="text-white/60 text-sm mt-3">{zitat.autor}</figcaption>
            </div>
          </figure>
        )}
      </div>
    </section>
  )
}
