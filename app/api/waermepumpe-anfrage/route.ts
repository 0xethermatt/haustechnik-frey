import { NextRequest, NextResponse } from 'next/server'
import {
  MAX_FOTOS,
  MAX_UPLOAD_BYTES,
  altanlageAusAnfrage,
  bereinigeAnfrage,
  bewerteAnfrage,
} from '@/lib/waermepumpe/anfrage'
import { berechneFoerderung } from '@/lib/waermepumpe/foerderung'
import { buroEmail, kundenEmail } from '@/lib/waermepumpe/email'

export const runtime = 'nodejs'

const RESEND_URL = 'https://api.resend.com/emails'
const DEFAULT_INVESTITION = 32000
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const FEHLER_TEXT =
  'Ihre Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie uns an: 07345 3286 – oder versuchen Sie es in ein paar Minuten erneut.'

// Best-effort Schutz gegen Massen-Submits pro Server-Instanz
const recentByIp = new Map<string, number[]>()
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  hits.push(now)
  recentByIp.set(ip, hits)
  return hits.length > RATE_MAX
}

interface ResendAttachment {
  filename: string
  content: string
}

async function sendMail(payload: {
  from: string
  to: string[]
  reply_to?: string
  subject: string
  html: string
  text: string
  attachments?: ResendAttachment[]
}): Promise<boolean> {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    console.error('WP-Anfrage: Resend-Fehler', res.status, await res.text().catch(() => ''))
  }
  return res.ok
}

function sanitizeFilename(name: string, index: number): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '-').slice(0, 40)
  return `${String(index + 1).padStart(2, '0')}-${base || 'foto'}.jpg`
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte rufen Sie uns direkt an: 07345 3286.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  // Honeypot + Mindestausfüllzeit: Bots bekommen ein stilles „ok“
  const startedAt = Number(form.get('startedAt'))
  if (form.get('website') || (startedAt && Date.now() - startedAt < 4000)) {
    return NextResponse.json({ ok: true })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(String(form.get('daten') ?? ''))
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const daten = bereinigeAnfrage(parsed)
  if (!daten) {
    return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Kontaktangaben.' }, { status: 422 })
  }

  const fotos = form.getAll('fotos').filter((f): f is File => f instanceof File).slice(0, MAX_FOTOS)
  const totalBytes = fotos.reduce((sum, f) => sum + f.size, 0)
  if (totalBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Die Fotos sind zu groß. Bitte weniger oder kleinere Bilder wählen.' }, { status: 413 })
  }

  const attachments: ResendAttachment[] = []
  for (let i = 0; i < fotos.length; i++) {
    const foto = fotos[i]
    if (!ALLOWED_TYPES.includes(foto.type)) continue
    const buffer = Buffer.from(await foto.arrayBuffer())
    attachments.push({ filename: sanitizeFilename(foto.name, i), content: buffer.toString('base64') })
  }

  const investitionRaw = Number(form.get('investition'))
  const investitionAnnahme =
    Number.isFinite(investitionRaw) && investitionRaw >= 5000 && investitionRaw <= 500000
      ? Math.round(investitionRaw)
      : DEFAULT_INVESTITION
  const eignung = String(form.get('eignung') ?? '').slice(0, 300) || undefined

  const wohneinheiten = Math.min(Math.max(parseInt(daten.wohneinheiten, 10) || 1, 1), 50)
  const selbstnutzer = daten.eigentum !== 'vermietet'
  const foerderung =
    daten.anliegen === 'neubau'
      ? null
      : berechneFoerderung({
          investition: investitionAnnahme,
          wohneinheiten,
          selbstnutzer,
          altanlage: altanlageAusAnfrage(daten),
          einkommen: daten.einkommen,
          kindImHaushalt: daten.kindImHaushalt,
        })

  const { prioritaet, hinweise } = bewerteAnfrage(daten)
  const ctx = {
    daten,
    prioritaet,
    hinweise,
    foerderung,
    investitionAnnahme,
    eignung,
    fotoNamen: attachments.map((a) => a.filename),
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('WP-Anfrage: RESEND_API_KEY fehlt – Anfrage nicht versendet', {
      name: `${daten.vorname} ${daten.nachname}`,
      telefon: daten.telefon,
      email: daten.email,
      ort: `${daten.plz} ${daten.ort}`,
    })
    return NextResponse.json({ error: FEHLER_TEXT }, { status: 503 })
  }

  const from = process.env.ANFRAGE_EMAIL_FROM ?? 'Haustechnik Frey <anfrage@haustechnik-frey.de>'
  const to = (process.env.ANFRAGE_EMAIL_TO ?? 'info@haustechnik-frey.de')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const buro = buroEmail(ctx)
  const buroOk = await sendMail({
    from,
    to,
    reply_to: daten.email,
    subject: buro.subject,
    html: buro.html,
    text: buro.text,
    attachments,
  })

  if (!buroOk) {
    return NextResponse.json({ error: FEHLER_TEXT }, { status: 502 })
  }

  const kunde = kundenEmail(ctx)
  await sendMail({
    from,
    to: [daten.email],
    reply_to: to[0],
    subject: kunde.subject,
    html: kunde.html,
    text: kunde.text,
  }).catch((e) => console.error('WP-Anfrage: Kundenbestätigung fehlgeschlagen', e))

  return NextResponse.json({ ok: true })
}
