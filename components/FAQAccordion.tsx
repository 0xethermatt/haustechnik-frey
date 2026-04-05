'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

interface Props {
  showAll?: boolean
  showHeading?: boolean
}

const categoryColors: Record<string, string> = {
  Heizung: 'bg-brand-orange/15 text-brand-orange-dark',
  'Sanitär / Bad': 'bg-brand-blue/15 text-brand-blue',
  'Solar & Energie': 'bg-brand-green/15 text-brand-green',
  Allgemein: 'bg-brand-purple/15 text-brand-purple',
}

const faqItems: FAQItem[] = [
  // Heizung
  {
    category: 'Heizung',
    question: 'Welche Heizung ist die beste für mein Zuhause?',
    answer:
      'Das hängt von Ihrem Gebäudetyp, der vorhandenen Infrastruktur und Ihren persönlichen Präferenzen ab. Wir bewerten Ihre individuelle Situation und beraten Sie ehrlich. Grundsätzlich gilt: Eine Wärmepumpe eignet sich besonders für Neubauten und gut gedämmte Bestandsgebäude. Eine Pelletheizung ist ideal für alle, die erneuerbar heizen möchten, ohne auf Komfort zu verzichten. Gas dient häufig noch als sinnvolle Brückentechnologie. Wir bieten Ihnen eine kostenlose Erstberatung an.',
  },
  {
    category: 'Heizung',
    question: 'Was kostet eine neue Heizungsanlage?',
    answer:
      'Die Kosten variieren je nach Heizsystem stark — von rund €8.000 für eine einfache Gastherme bis über €25.000 für eine große Wärmepumpe inkl. Pufferspeicher. Nach Abzug der BEG-Förderung (bis zu 70 % möglich) liegen die effektiven Kosten häufig zwischen €5.000 und €15.000. Wir erstellen Ihnen einen kostenlosen und detaillierten Kostenvoranschlag.',
  },
  {
    category: 'Heizung',
    question: 'Wie hoch ist die BEG-Förderung für Wärmepumpen?',
    answer:
      'Die Bundesförderung für effiziente Gebäude (BEG) bietet eine Grundförderung von 30 %. Wer eine alte Öl-, Gas- oder Nachtspeicherheizung ersetzt, erhält zusätzlich den Klimabonus von 5 % — also 35 %. Bei einem jährlichen Haushaltseinkommen von max. €40.000 kommt nochmals ein Einkommensbonus von 5 % dazu, was 40 % ergibt. Die maximal förderfähigen Kosten betragen €30.000 für Ein- und Zweifamilienhäuser und €75.000 für Mehrfamilienhäuser. Der Antrag läuft über die BAFA. Wir unterstützen Sie dabei.',
  },
  {
    category: 'Heizung',
    question: 'Wie lange hält eine Heizungsanlage?',
    answer:
      'Moderne Heizungsanlagen erreichen bei regelmäßiger Wartung eine Lebensdauer von 15 bis 20 Jahren, teilweise auch deutlich länger. Eine jährliche Inspektion ist dabei entscheidend — sie verlängert die Lebensdauer, sichert die Effizienz und ist häufig Voraussetzung für Garantieleistungen der Hersteller.',
  },
  // Sanitär / Bad
  {
    category: 'Sanitär / Bad',
    question: 'Wie lange dauert eine Badsanierung?',
    answer:
      'Die Dauer hängt vom Umfang der Arbeiten ab: Ein kleines Bad mit wenigen Änderungen ist oft in 1–2 Wochen fertig. Eine vollständige Kernsanierung mit neuem Grundriss und gefliesten Wänden dauert typischerweise 2–4 Wochen. In unserem Angebot erhalten Sie einen genauen Zeitplan, auf den wir uns verbindlich festlegen.',
  },
  {
    category: 'Sanitär / Bad',
    question: 'Was kostet eine Badsanierung?',
    answer:
      'Orientierungswerte: Einfache Sanierung (Armaturen, Dusche, WC-Erneuerung) ab €5.000 bis €10.000; mittlere Sanierung mit neuem Fliesen und Möbeln €10.000 bis €20.000; hochwertige Komplettsanierung ab €20.000 aufwärts. Für eine realistische Einschätzung bieten wir eine kostenlose Beratung vor Ort an.',
  },
  {
    category: 'Sanitär / Bad',
    question: 'Bieten Sie barrierefreie Bäder an?',
    answer:
      'Ja — wir planen und installieren barrierefreie Bäder nach DIN 18040, mit ebenerdiger Dusche, Haltegriffen und bequemen Sitzmöglichkeiten. Für Umbauten zur Barrierefreiheit können KfW-Fördergelder oder Zuschüsse der Pflegekassen in Anspruch genommen werden. Wir beraten Sie zu allen Fördermöglichkeiten.',
  },
  {
    category: 'Sanitär / Bad',
    question: 'Welche Marken verbaut ihr im Bad?',
    answer:
      'Wir arbeiten ausschließlich mit namhaften Markenherstellern: Grohe, Hansgrohe, Hansa, Geberit, Villeroy & Boch, Duravit und Laufen — Marken, die für Qualität, Langlebigkeit und herstellerseitige Garantie stehen. Auf Wunsch beraten wir Sie bei der Materialauswahl direkt vor Ort oder im Showroom.',
  },
  // Solar & Energie
  {
    category: 'Solar & Energie',
    question: 'Lohnt sich Solarthermie noch?',
    answer:
      'Absolut. Eine Solarthermieanlage deckt 60–70 % des jährlichen Warmwasserbedarfs eines Durchschnittshaushalts. Die Amortisationszeit liegt typischerweise bei 8–12 Jahren, während die Lebensdauer der Anlage 20–25 Jahre beträgt — das ergibt eine erhebliche Ersparnis über die gesamte Laufzeit.',
  },
  {
    category: 'Solar & Energie',
    question: 'Was ist der Unterschied zwischen Solarthermie und Photovoltaik?',
    answer:
      'Solarthermie nutzt die Sonnenenergie direkt zur Wärmeerzeugung (Warmwasser, Heizungsunterstützung). Photovoltaik wandelt Sonnenstrahlen in elektrischen Strom um. Wir installieren Solarthermieanlagen. Beide Technologien lassen sich hervorragend kombinieren und ergänzen sich ideal.',
  },
  {
    category: 'Solar & Energie',
    question: 'Gibt es Förderung für Solarthermie?',
    answer:
      'Ja — über die BEG EM (Einzelmaßnahmen) gibt es eine Grundförderung von 25 % der förderfähigen Kosten. Zusätzlich können Landes- oder Kommunalprogramme weitere Zuschüsse bieten. Wir beraten Sie kostenlos zu allen verfügbaren Fördermöglichkeiten und helfen beim Antragsverfahren.',
  },
  // Allgemein
  {
    category: 'Allgemein',
    question: 'In welchem Gebiet sind Sie tätig?',
    answer:
      'Unser Kerngebiet ist Langenau und der gesamte Einzugsbereich: Ulm, Neu-Ulm, Blaubeuren, Giengen an der Brenz, Heidenheim an der Brenz und Herbrechtingen — also einen Umkreis von rund 50 km. Für Bestandskunden fahren wir auf Anfrage auch darüber hinaus.',
  },
  {
    category: 'Allgemein',
    question: 'Wie schnell können Sie einen Termin vereinbaren?',
    answer:
      'Für nicht dringende Arbeiten haben wir in der Regel innerhalb von 1–2 Wochen einen Termin frei. Bei Notfällen kommen wir noch am gleichen oder am nächsten Tag. Rufen Sie uns direkt an — wir finden gemeinsam die schnellste Lösung.',
  },
  {
    category: 'Allgemein',
    question: 'Übernehmen Sie auch die Förderanträge?',
    answer:
      'Ja — wir beraten Sie umfassend zu BAFA- und KfW-Förderanträgen und helfen aktiv bei der Antragsstellung. Viele unserer Kunden sparen dadurch mehrere tausend Euro. Diesen Service bieten wir als Teil unserer Beratungsleistung an.',
  },
  {
    category: 'Allgemein',
    question: 'Sind Sie ein Meisterbetrieb?',
    answer:
      'Ja — Andreas Frey ist geprüfter Meister im SHK-Handwerk (Sanitär, Heizung, Klimatechnik). Der Meistertitel ist gesetzliche Voraussetzung für zahlreiche Installationsarbeiten und steht als Qualitätsgarantie für fachgerechte Ausführung und fundierte Beratung.',
  },
]

export default function FAQAccordion({ showAll = false, showHeading = true }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  const visibleItems = showAll ? faqItems : faqItems.slice(0, 5)

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-brand-warm" aria-labelledby="faq-accordion-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {showHeading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
              Häufige Fragen
            </span>
            <h2
              id="faq-accordion-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight"
            >
              FAQ
            </h2>
            <p className="mt-5 text-sm sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Antworten auf die Fragen, die uns am häufigsten gestellt werden. Etwas fehlt?
              Sprechen Sie uns direkt an.
            </p>
          </motion.div>
        )}

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {visibleItems.map((item, i) => {
            const isOpen = openIndex === i

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.3) }}
                className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-brand-orange/40 shadow-card border-l-2 border-l-brand-orange'
                    : 'border-transparent shadow-card hover:border-brand-orange/20 border-l-2 border-l-transparent'
                }`}
              >
                {/* Question row */}
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-inset rounded-2xl"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="flex-1 font-semibold text-brand-purple-deep text-sm leading-snug">
                    {item.question}
                  </span>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex-shrink-0"
                    aria-hidden="true"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-colors duration-200 ${isOpen ? 'text-brand-orange' : 'text-gray-400'}`}
                    />
                  </motion.span>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                      role="region"
                      aria-label={item.question}
                    >
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>

        {/* "Alle Fragen ansehen" button — only when not showing all */}
        {!showAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-10"
          >
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white font-semibold px-8 py-3 rounded-full transition-all"
            >
              Alle 15 Fragen ansehen →
            </Link>
          </motion.div>
        )}

        {/* Bottom CTA — only when showing all */}
        {showAll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-14"
          >
            <p className="text-gray-500 mb-5 text-base">
              Ihre Frage ist nicht dabei? Wir helfen Ihnen gerne persönlich weiter.
            </p>
            <a
              href="tel:+4973453286"
              className="inline-flex items-center gap-2 bg-brand-purple-deep hover:bg-brand-purple-dark text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-purple-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              Jetzt anrufen — 07345 3286
            </a>
          </motion.div>
        )}
      </div>
    </section>
  )
}
