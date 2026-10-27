// Gemeinsamer E-Mail-Versand für alle Anfrageformulare (Resend REST-API)

const RESEND_URL = 'https://api.resend.com/emails'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const FEHLER_TEXT =
  'Ihre Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie uns an: 07345 3286 – oder versuchen Sie es in ein paar Minuten erneut.'

export interface ResendAttachment {
  filename: string
  content: string
}

export interface MailPayload {
  from: string
  to: string[]
  reply_to?: string
  subject: string
  html: string
  text: string
  attachments?: ResendAttachment[]
}

export function mailKonfiguriert(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function mailAdressen(): { from: string; to: string[] } {
  return {
    from: process.env.ANFRAGE_EMAIL_FROM ?? 'Haustechnik Frey <anfrage@haustechnik-frey.de>',
    to: (process.env.ANFRAGE_EMAIL_TO ?? 'info@haustechnik-frey.de')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

export async function sendMail(payload: MailPayload, logPrefix: string): Promise<boolean> {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    console.error(`${logPrefix}: Resend-Fehler`, res.status, await res.text().catch(() => ''))
  }
  return res.ok
}

// Best-effort Schutz gegen Massen-Submits pro Server-Instanz
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5

export function createRateLimiter() {
  const recentByIp = new Map<string, number[]>()
  return (ip: string): boolean => {
    const now = Date.now()
    const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
    hits.push(now)
    recentByIp.set(ip, hits)
    return hits.length > RATE_MAX
  }
}

/** Honeypot + Mindestausfüllzeit – true heißt: vermutlich Bot. */
export function istSpam(form: FormData): boolean {
  const startedAt = Number(form.get('startedAt'))
  return Boolean(form.get('website')) || Boolean(startedAt && Date.now() - startedAt < 4000)
}

function sanitizeFilename(name: string, index: number): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '-').slice(0, 40)
  return `${String(index + 1).padStart(2, '0')}-${base || 'foto'}.jpg`
}

/** Liest Fotos aus dem Formular; null bei Überschreitung der Gesamtgröße. */
export async function fotosAlsAnhang(
  form: FormData,
  maxFotos: number,
  maxBytes: number
): Promise<ResendAttachment[] | null> {
  const fotos = form.getAll('fotos').filter((f): f is File => f instanceof File).slice(0, maxFotos)
  if (fotos.reduce((sum, f) => sum + f.size, 0) > maxBytes) return null

  const attachments: ResendAttachment[] = []
  for (let i = 0; i < fotos.length; i++) {
    const foto = fotos[i]
    if (!ALLOWED_TYPES.includes(foto.type)) continue
    const buffer = Buffer.from(await foto.arrayBuffer())
    attachments.push({ filename: sanitizeFilename(foto.name, i), content: buffer.toString('base64') })
  }
  return attachments
}
