import EnergyAdvisorWidget from '@/components/energy-advisor/EnergyAdvisorWidget'
import EnergyAdvisorLeadCapture from '@/components/energy-advisor/EnergyAdvisorLeadCapture'
import { Zap, Shield, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Energieberater — Test | Haustechnik Frey',
  robots: { index: false, follow: false },
}

export default function EnergieberaterTestPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <div className="bg-brand-purple-deep text-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-orange" />
            <span className="font-semibold text-sm">Energieberater — Testumgebung</span>
          </div>
          <Link href="/" className="text-white/50 hover:text-white text-xs transition-colors">
            ← Zur Website
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5" />
            Interne Testseite · Nicht öffentlich indexiert
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-purple-deep mb-2">
            Digitaler Energieberater
          </h1>
          <p className="text-brand-purple-deep/60 text-sm lg:text-base max-w-xl">
            KI-gestützter Lead-Qualifier und Sanierungsberater für Heizung, Bad, Lüftung und Förderungen.
            Feature Flag: <code className="bg-brand-purple/10 px-1.5 py-0.5 rounded text-brand-purple font-mono text-xs">NEXT_PUBLIC_ENERGY_ADVISOR_ENABLED</code>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Chat — main column */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-purple-deep/70 uppercase tracking-wide">Chat-Widget (Embedded)</h2>
            </div>
            <EnergyAdvisorWidget embedded={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Lead Capture */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-brand-purple/5">
              <div className="px-4 pt-4 pb-1">
                <h2 className="text-sm font-semibold text-brand-purple-deep/70 uppercase tracking-wide">Lead Capture (Demo)</h2>
              </div>
              <EnergyAdvisorLeadCapture />
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl shadow-card p-4 border border-brand-purple/5 space-y-3">
              <h3 className="text-sm font-semibold text-brand-purple-deep">Funktionen</h3>
              {[
                'Starter-Fragen für sofortigen Einstieg',
                'Emergency-Erkennung (Gasgeruch etc.)',
                'Lead-Intent-Erkennung',
                'Modell-Routing (Standard ↔ Escalation)',
                'API-Key nur serverseitig',
                'Feature Flag per Env-Variable',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-brand-purple-deep/70">
                  <ChevronRight className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-brand-purple-deep rounded-2xl p-4 text-white space-y-3">
              <h3 className="text-sm font-semibold">Direktkontakt</h3>
              <a
                href="tel:+4973453286"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4 text-brand-orange" />
                07345 3286
              </a>
              <p className="text-white/40 text-xs">Mo–Fr 7–18 Uhr · Sa 8–13 Uhr</p>
            </div>
          </div>
        </div>

        {/* Tech info */}
        <div className="mt-8 p-4 bg-white/60 rounded-2xl border border-brand-purple/5 text-xs text-brand-purple-deep/40 space-y-1">
          <p className="font-semibold text-brand-purple-deep/60">Technische Konfiguration</p>
          <p>API: <code>POST /api/energy-advisor</code> · Modell: <code>ENERGY_ADVISOR_MODEL</code> (Standard: claude-haiku-4-5-20251001)</p>
          <p>Eskalations-Modell: <code>ENERGY_ADVISOR_ESCALATION_MODEL</code> (Standard: claude-sonnet-4-6)</p>
          <p>Für globalen Live-Einsatz: <code>NEXT_PUBLIC_ENERGY_ADVISOR_ENABLED=true</code> setzen und Widget in layout.tsx einbinden</p>
        </div>
      </div>
    </div>
  )
}
