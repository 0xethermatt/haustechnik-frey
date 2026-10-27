import { BadgeEuro, Leaf, Snowflake, ShieldCheck, TrendingDown, Home, X, Check } from 'lucide-react'
import { formatEuro, getPeriode } from '@/lib/waermepumpe/foerderung'

const vorteile = () => [
  {
    icon: TrendingDown,
    title: 'Deutlich niedrigere Heizkosten',
    text: 'Aus 1 kWh Strom werden 3–4 kWh Wärme. Mit Wärmepumpentarif und PV sinken die laufenden Kosten gegenüber Öl und Gas spürbar.',
    color: 'text-brand-green bg-brand-green/10',
  },
  {
    icon: BadgeEuro,
    title: 'Bis zu 80 % Zuschuss',
    text: `Die KfW fördert den Heizungstausch mit 30 % Grundförderung plus Klima- und Einkommensbonus – bis zu ${formatEuro(getPeriode().kostenErsteWE * 0.8)} pro Haus.`,
    color: 'text-brand-orange-dark bg-brand-orange/10',
  },
  {
    icon: ShieldCheck,
    title: 'Unabhängig von Öl, Gas & CO₂-Preis',
    text: 'Der CO₂-Preis auf fossile Brennstoffe steigt weiter. Mit einer Wärmepumpe sind Sie davon nicht mehr betroffen.',
    color: 'text-brand-blue bg-brand-blue/10',
  },
  {
    icon: Leaf,
    title: 'Gesetzlich auf der sicheren Seite',
    text: 'Eine Wärmepumpe erfüllt die 65-%-Erneuerbare-Vorgabe des Gebäudeenergiegesetzes vollständig – ohne Nachrüstpflichten.',
    color: 'text-brand-teal bg-brand-teal/10',
  },
  {
    icon: Snowflake,
    title: 'Im Sommer leise kühlen',
    text: 'Viele Geräte können die Fußbodenheizung im Sommer zur sanften Kühlung nutzen – ohne zusätzliches Klimagerät.',
    color: 'text-brand-blue bg-brand-blue/10',
  },
  {
    icon: Home,
    title: 'Wertsteigerung Ihrer Immobilie',
    text: 'Eine moderne, erneuerbare Heizung verbessert die Energieeffizienzklasse und macht Ihr Haus attraktiver für Käufer und Mieter.',
    color: 'text-brand-purple bg-brand-purple/10',
  },
]

const mythen = [
  {
    mythos: 'Im Altbau funktioniert keine Wärmepumpe.',
    fakt: 'Entscheidend ist die Vorlauftemperatur. Bis 55 °C arbeiten moderne Geräte effizient – das schaffen die meisten Altbauten, oft nach Tausch einzelner Heizkörper.',
  },
  {
    mythos: 'Ohne Fußbodenheizung lohnt es sich nicht.',
    fakt: 'Die Mehrheit der Wärmepumpen im Bestand läuft mit normalen Heizkörpern. Wir prüfen raumweise, ob alle Heizflächen ausreichen.',
  },
  {
    mythos: 'Bei Minusgraden heizt sie mit teurem Heizstab.',
    fakt: 'Richtig dimensionierte Geräte heizen bis −20 °C mit dem Kältekreis. Der Heizstab springt nur an wenigen Extremtagen kurz an.',
  },
  {
    mythos: 'Wärmepumpen sind laut.',
    fakt: 'Für die Förderung müssen Geräte die Lärmgrenzwerte um mindestens 10 dB unterschreiten. In wenigen Metern Abstand: etwa so laut wie ein Kühlschrank.',
  },
  {
    mythos: 'Die Stromkosten fressen die Ersparnis auf.',
    fakt: 'Mit einer Jahresarbeitszahl von 3–4 und einem Wärmepumpentarif liegen die Kosten pro kWh Wärme meist unter Öl und Gas – rechnen Sie es unten nach.',
  },
]

export default function WPVorteile() {
  return (
    <section id="vorteile" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-white" aria-labelledby="vorteile-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 sm:mb-12">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Warum Wärmepumpe
          </span>
          <h2 id="vorteile-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight">
            Die Heizung, die sich doppelt rechnet
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {vorteile().map((v) => (
            <div key={v.title} className="rounded-3xl border border-brand-purple/10 bg-brand-cream p-6 hover:shadow-card-hover transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${v.color}`}>
                <v.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-brand-purple-deep mb-2">{v.title}</h3>
              <p className="text-sm text-brand-purple-deep/65 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep mb-6">
            5 Mythen – und was wirklich stimmt
          </h3>
          <div className="grid gap-3">
            {mythen.map((m) => (
              <div key={m.mythos} className="grid md:grid-cols-[1fr_1.6fr] rounded-2xl overflow-hidden border border-brand-purple/10">
                <div className="flex gap-3 items-start bg-brand-warm px-5 py-4">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="font-semibold text-brand-purple-deep/80 line-through decoration-red-400/50">{m.mythos}</p>
                </div>
                <div className="flex gap-3 items-start bg-white px-5 py-4">
                  <Check className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-brand-purple-deep/75 leading-relaxed">{m.fakt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
