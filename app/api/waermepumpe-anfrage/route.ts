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

const DEFAULT_INVESTITION = 32000
const LOG = 'WP-Anfrage'

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

  // Bots bekommen ein stilles „ok“
  if (istSpam(form)) return NextResponse.json({ ok: true })

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

  const attachments = await fotosAlsAnhang(form, MAX_FOTOS, MAX_UPLOAD_BYTES)
  if (!attachments) {
    return NextResponse.json({ error: 'Die Fotos sind zu groß. Bitte weniger oder kleinere Bilder wählen.' }, { status: 413 })
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

  if (!mailKonfiguriert()) {
    console.error(`${LOG}: RESEND_API_KEY fehlt – Anfrage nicht versendet`, {
      name: `${daten.vorname} ${daten.nachname}`,
      telefon: daten.telefon,
      email: daten.email,
      ort: `${daten.plz} ${daten.ort}`,
    })
    return NextResponse.json({ error: FEHLER_TEXT }, { status: 503 })
  }

  const { from, to } = mailAdressen()

  const buro = buroEmail(ctx)
  const buroOk = await sendMail({
    from,
    to,
    reply_to: daten.email,
    subject: buro.subject,
    html: buro.html,
    text: buro.text,
    attachments,
  }, LOG)

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
  }, LOG).catch((e) => console.error(`${LOG}: Kundenbestätigung fehlgeschlagen`, e))

  return NextResponse.json({ ok: true })
}
