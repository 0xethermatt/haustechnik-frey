import Image from 'next/image'
import { Quote } from 'lucide-react'
import { REFERENZ } from '@/lib/waermepumpe/referenz'

export default function WPReferenz() {
  const { titel, einleitung, fakten, schritte, zitat } = REFERENZ
  if (schritte.length === 0) return null

  return (
    <section id="referenz" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-white" aria-labelledby="referenz-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Aus unserer Praxis
          </span>
          <h2 id="referenz-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight mb-4">
            {titel}
          </h2>
          <p className="text-base sm:text-lg text-brand-purple-deep/70 leading-relaxed">{einleitung}</p>
        </div>

        {fakten.length > 0 && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {fakten.map((f) => (
              <div key={f.label} className="bg-brand-cream rounded-2xl px-4 py-3 border border-brand-purple/10">
                <dt className="text-xs text-brand-purple-deep/50">{f.label}</dt>
                <dd className="font-bold text-brand-purple-deep">{f.wert}</dd>
              </div>
            ))}
          </dl>
        )}

        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
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
