import { NextRequest, NextResponse } from 'next/server'
import { KONTAKT_MAX_BYTES, KONTAKT_MAX_FOTOS, bereinigeKontakt, prioritaetVon } from '@/lib/kontakt/anfrage'
import { kontaktBuroEmail, kontaktKundenEmail } from '@/lib/kontakt/email'
import {
  FEHLER_TEXT,
  createRateLimiter,
  fotosAlsAnhang,
  istSpam,
  mailAdressen,
  mailKonfiguriert,
  sendMail,
} from '@/lib/mail/resend'

export const runtime = 'nodejs'

const LOG = 'Kontakt-Anfrage'
const rateLimited = createRateLimiter()

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

  if (istSpam(form)) return NextResponse.json({ ok: true })

  let parsed: unknown
  try {
    parsed = JSON.parse(String(form.get('daten') ?? ''))
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const daten = bereinigeKontakt(parsed)
  if (!daten) {
    return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Angaben.' }, { status: 422 })
  }

  const attachments = await fotosAlsAnhang(form, KONTAKT_MAX_FOTOS, KONTAKT_MAX_BYTES)
  if (!attachments) {
    return NextResponse.json({ error: 'Die Fotos sind zu groß. Bitte weniger oder kleinere Bilder wählen.' }, { status: 413 })
  }

  if (!mailKonfiguriert()) {
    console.error(`${LOG}: RESEND_API_KEY fehlt – Anfrage nicht versendet`, {
      name: daten.name,
      telefon: daten.telefon,
      ort: `${daten.plz} ${daten.ort}`,
    })
    return NextResponse.json({ error: FEHLER_TEXT }, { status: 503 })
  }

  const { from, to } = mailAdressen()
  const buro = kontaktBuroEmail(daten, prioritaetVon(daten), attachments.map((a) => a.filename))
  const buroOk = await sendMail(
    {
      from,
      to,
      reply_to: daten.email || undefined,
      subject: buro.subject,
      html: buro.html,
      text: buro.text,
      attachments,
    },
    LOG
  )
  if (!buroOk) return NextResponse.json({ error: FEHLER_TEXT }, { status: 502 })

  if (daten.email) {
    const kunde = kontaktKundenEmail(daten)
    await sendMail(
      { from, to: [daten.email], reply_to: to[0], subject: kunde.subject, html: kunde.html, text: kunde.text },
      LOG
    ).catch((e) => console.error(`${LOG}: Kundenbestätigung fehlgeschlagen`, e))
  }

  return NextResponse.json({ ok: true })
}
