'use client'

import { useState } from 'react'
import { CheckCircle, Phone } from 'lucide-react'

interface LeadFormData {
  name: string
  telefon: string
  massnahme: string
}

export default function EnergyAdvisorLeadCapture() {
  const [form, setForm] = useState<LeadFormData>({ name: '', telefon: '', massnahme: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // In production: send to CRM / email / contact API
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center px-4">
        <CheckCircle className="w-10 h-10 text-brand-green" />
        <p className="font-semibold text-brand-purple-deep">Danke, {form.name}!</p>
        <p className="text-sm text-brand-purple-deep/60">
          Wir melden uns so schnell wie möglich bei Ihnen.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
      <p className="text-sm font-semibold text-brand-purple-deep">Rückruf anfragen</p>
      <input
        type="text"
        placeholder="Ihr Name"
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="w-full text-sm px-4 py-2.5 rounded-xl border border-brand-purple/20 focus:outline-none focus:border-brand-purple/50 bg-brand-warm text-brand-purple-deep placeholder:text-brand-purple-deep/40"
      />
      <input
        type="tel"
        placeholder="Telefonnummer"
        required
        value={form.telefon}
        onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
        className="w-full text-sm px-4 py-2.5 rounded-xl border border-brand-purple/20 focus:outline-none focus:border-brand-purple/50 bg-brand-warm text-brand-purple-deep placeholder:text-brand-purple-deep/40"
      />
      <select
        value={form.massnahme}
        onChange={(e) => setForm((f) => ({ ...f, massnahme: e.target.value }))}
        className="w-full text-sm px-4 py-2.5 rounded-xl border border-brand-purple/20 focus:outline-none focus:border-brand-purple/50 bg-brand-warm text-brand-purple-deep"
      >
        <option value="">Thema wählen (optional)</option>
        <option value="waermepumpe">Wärmepumpe</option>
        <option value="heizung">Heizungsmodernisierung</option>
        <option value="bad">Badsanierung</option>
        <option value="foerderung">Förderung</option>
        <option value="sonstiges">Sonstiges</option>
      </select>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
      >
        <Phone className="w-4 h-4" />
        Rückruf anfragen
      </button>
    </form>
  )
}
