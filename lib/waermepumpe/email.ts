import {
  ANLIEGEN,
  AUFSTELLORT,
  BAUJAHR,
  EIGENTUM,
  ENERGIETRAEGER,
  ERREICHBARKEIT,
  GEBAEUDETYP,
  NACHBARABSTAND,
  PV,
  SANIERUNG,
  VERBRAUCH_EINHEIT,
  VORLAUF,
  WAERMEVERTEILUNG,
  ZAEHLERSCHRANK,
  ZEITRAUM,
  labelOf,
  type Prioritaet,
  type WPAnfrageDaten,
} from './anfrage'
import { EINKOMMEN_LABELS, formatEuro, type FoerderErgebnis } from './foerderung'

const BRAND = '#6B2D8B'
const ORANGE = '#E8A030'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Row = [string, string]

function sections(d: WPAnfrageDaten): { title: string; rows: Row[] }[] {
  return [
    {
      title: 'Vorhaben',
      rows: [
        ['Anliegen', labelOf(ANLIEGEN, d.anliegen)],
        ['Zeitraum', labelOf(ZEITRAUM, d.zeitraum)],
      ],
    },
    {
      title: 'Gebäude',
      rows: [
        ['Gebäudetyp', labelOf(GEBAEUDETYP, d.gebaeudetyp)],
        ['Baujahr', labelOf(BAUJAHR, d.baujahr)],
        ['Wohnfläche', d.wohnflaeche ? `${d.wohnflaeche} m²` : '–'],
        ['Wohneinheiten', d.wohneinheiten || '1'],
        ['Sanierung', d.sanierung.length ? d.sanierung.map((s) => labelOf(SANIERUNG, s)).join(', ') : 'keine Angabe'],
      ],
    },
    {
      title: 'Heizung heute',
      rows: [
        ['Energieträger', labelOf(ENERGIETRAEGER, d.energietraeger)],
        ['Baujahr Heizung', d.heizungBaujahr || '–'],
        ['Jahresverbrauch', d.verbrauch ? `${d.verbrauch} ${labelOf(VERBRAUCH_EINHEIT, d.verbrauchEinheit)}` : '–'],
        ['Wärmeverteilung', labelOf(WAERMEVERTEILUNG, d.waermeverteilung)],
        ['Vorlauftemperatur', labelOf(VORLAUF, d.vorlauf)],
      ],
    },
    {
      title: 'Aufstellung & Strom',
      rows: [
        ['Aufstellort', labelOf(AUFSTELLORT, d.aufstellort)],
        ['Abstand Nachbar', labelOf(NACHBARABSTAND, d.nachbarabstand)],
        ['PV-Anlage', labelOf(PV, d.pv)],
        ['Zählerschrank', labelOf(ZAEHLERSCHRANK, d.zaehlerschrank)],
      ],
    },
    {
      title: 'Förderung',
      rows: [
        ['Nutzung', labelOf(EIGENTUM, d.eigentum)],
        ['zvE Haushalt', EINKOMMEN_LABELS[d.einkommen]],
        ['Minderjähriges Kind', d.kindImHaushalt ? 'Ja' : 'Nein'],
      ],
    },
    {
      title: 'Kontakt',
      rows: [
        ['Name', `${d.vorname} ${d.nachname}`],
        ['Adresse', [d.strasse, `${d.plz} ${d.ort}`].filter(Boolean).join(', ')],
        ['Telefon', d.telefon],
        ['E-Mail', d.email],
        ['Erreichbar', labelOf(ERREICHBARKEIT, d.erreichbarkeit)],
      ],
    },
  ]
}

function table(rows: Row[]): string {
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#111827;font-size:14px">${esc(v)}</td></tr>`
    )
    .join('')
}

function layout(inner: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#FAF8F6;font-family:Arial,Helvetica,sans-serif;color:#2D1140">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
<div style="background:#2D1140;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ORANGE};font-weight:bold">Haustechnik Frey</div>
<div style="font-size:20px;font-weight:bold;margin-top:4px">Wärmepumpen-Check</div>
</div>
<div style="background:#fff;padding:24px;border-radius:0 0 16px 16px;border:1px solid #eee;border-top:0">${inner}</div>
<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:16px">Haustechnik Andreas Frey · Schammenstraße 19 · 89129 Langenau · 07345 3286</p>
</div></body></html>`
}

const PRIO_STYLE: Record<Prioritaet, { label: string; bg: string; fg: string }> = {
  hoch: { label: 'PRIORITÄT HOCH', bg: '#FEE2E2', fg: '#B91C1C' },
  mittel: { label: 'Priorität mittel', bg: '#FEF3C7', fg: '#92400E' },
  normal: { label: 'Priorität normal', bg: '#E5E7EB', fg: '#374151' },
}

function foerderBlock(f: FoerderErgebnis | null, investition: number): Row[] {
  if (!f) return []
  return [
    ['Annahme Investition', formatEuro(investition)],
    ['Fördersatz (selbstgenutzt)', `${f.satzSelbstgenutzt} % (Grund ${f.grund} % + Klima ${f.klima} % + Einkommen ${f.einkommen} %)`],
    ['Geschätzter Zuschuss', formatEuro(f.zuschuss)],
    ['Eigenanteil', formatEuro(f.eigenanteil)],
  ]
}

export interface EmailKontext {
  daten: WPAnfrageDaten
  prioritaet: Prioritaet
  hinweise: string[]
  foerderung: FoerderErgebnis | null
  investitionAnnahme: number
  eignung?: string
  fotoNamen: string[]
}

export function buroEmail(ctx: EmailKontext): { subject: string; html: string; text: string } {
  const { daten: d, prioritaet, hinweise, foerderung, investitionAnnahme, eignung, fotoNamen } = ctx
  const prio = PRIO_STYLE[prioritaet]
  const subject = `${prioritaet === 'hoch' ? '[DRINGEND] ' : ''}Wärmepumpen-Anfrage: ${d.vorname} ${d.nachname}, ${d.plz} ${d.ort} – ${labelOf(ANLIEGEN, d.anliegen)}`

  const blocks = sections(d)
  const foerderRows = foerderBlock(foerderung, investitionAnnahme)

  const html = layout(`
<div style="display:inline-block;background:${prio.bg};color:${prio.fg};font-weight:bold;font-size:12px;padding:4px 10px;border-radius:999px">${prio.label}</div>
<h2 style="margin:12px 0 4px;font-size:20px">${esc(d.vorname)} ${esc(d.nachname)} · ${esc(d.plz)} ${esc(d.ort)}</h2>
<p style="margin:0 0 16px;font-size:14px"><a href="tel:${esc(d.telefon.replace(/[^\d+]/g, ''))}" style="color:${BRAND};font-weight:bold">${esc(d.telefon)}</a> · <a href="mailto:${esc(d.email)}" style="color:${BRAND}">${esc(d.email)}</a> · erreichbar: ${esc(labelOf(ERREICHBARKEIT, d.erreichbarkeit))}</p>
${
  hinweise.length
    ? `<div style="background:#FFF7E6;border:1px solid #F5D9A8;border-radius:12px;padding:12px 16px;margin-bottom:16px"><div style="font-weight:bold;font-size:13px;margin-bottom:6px">Hinweise für Rückruf &amp; Vor-Ort-Termin</div><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6">${hinweise.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>`
    : ''
}
${eignung ? `<p style="font-size:13px;margin:0 0 16px"><strong>Eignungs-Check des Kunden:</strong> ${esc(eignung)}</p>` : ''}
${blocks
  .map(
    (b) =>
      `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND};margin:20px 0 6px">${esc(b.title)}</h3><table style="border-collapse:collapse;width:100%">${table(b.rows)}</table>`
  )
  .join('')}
${foerderRows.length ? `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND};margin:20px 0 6px">Förderschätzung (automatisch)</h3><table style="border-collapse:collapse;width:100%">${table(foerderRows)}</table>` : ''}
${d.nachricht ? `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND};margin:20px 0 6px">Nachricht</h3><p style="font-size:14px;white-space:pre-wrap;margin:0">${esc(d.nachricht)}</p>` : ''}
<p style="font-size:13px;color:#6b7280;margin-top:20px">Fotos: ${fotoNamen.length ? esc(fotoNamen.join(', ')) + ' (im Anhang)' : 'keine'}</p>
`)

  const text = [
    `${prio.label}`,
    `${d.vorname} ${d.nachname} · ${d.plz} ${d.ort}`,
    `Tel: ${d.telefon} · E-Mail: ${d.email} · erreichbar: ${labelOf(ERREICHBARKEIT, d.erreichbarkeit)}`,
    '',
    ...(hinweise.length ? ['HINWEISE', ...hinweise.map((h) => `- ${h}`), ''] : []),
    ...(eignung ? [`Eignungs-Check: ${eignung}`, ''] : []),
    ...blocks.flatMap((b) => [b.title.toUpperCase(), ...b.rows.map(([k, v]) => `${k}: ${v}`), '']),
    ...(foerderRows.length ? ['FÖRDERSCHÄTZUNG', ...foerderRows.map(([k, v]) => `${k}: ${v}`), ''] : []),
    ...(d.nachricht ? ['NACHRICHT', d.nachricht, ''] : []),
    `Fotos: ${fotoNamen.length ? fotoNamen.join(', ') : 'keine'}`,
  ].join('\n')

  return { subject, html, text }
}

export function kundenEmail(ctx: EmailKontext): { subject: string; html: string; text: string } {
  const { daten: d, foerderung, investitionAnnahme } = ctx
  const subject = 'Ihre Wärmepumpen-Anfrage bei Haustechnik Frey'

  const schritte = [
    'Wir prüfen Ihre Angaben und melden uns in der Regel innerhalb von 1–2 Werktagen telefonisch bei Ihnen.',
    'Gemeinsam vereinbaren wir einen Vor-Ort-Termin, bei dem wir Heizlast, Aufstellort und Elektrik prüfen.',
    'Sie erhalten ein verbindliches Angebot mit Förderklausel und die Bestätigung zum Antrag (BzA) für die KfW.',
    'Nach der Förderzusage bauen wir Ihre Wärmepumpe ein – meist in 3–5 Arbeitstagen.',
  ]
  const unterlagen = [
    'Heizkostenabrechnungen bzw. Verbrauch der letzten 2–3 Jahre',
    'Foto vom Typenschild Ihrer aktuellen Heizung',
    'Grundrisse oder Pläne des Hauses (falls vorhanden)',
    ...(foerderung && foerderung.einkommen > 0
      ? [`Einkommensteuerbescheide ${foerderung.steuerjahre[0]} und ${foerderung.steuerjahre[1]} (für den Einkommensbonus)`]
      : []),
  ]

  const foerderHtml = foerderung
    ? `<div style="background:#F3F0EC;border-radius:12px;padding:16px;margin:20px 0">
<div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BRAND};font-weight:bold">Ihre erste Förderschätzung</div>
<div style="font-size:26px;font-weight:bold;margin:6px 0">ca. ${formatEuro(foerderung.zuschuss)} Zuschuss</div>
<div style="font-size:13px;color:#4b5563">${foerderung.satzSelbstgenutzt} % Fördersatz bei angenommenen ${formatEuro(investitionAnnahme)} Investition. Unverbindlicher Richtwert – die genaue Höhe ergibt sich aus Angebot und KfW-Zusage.</div>
</div>`
    : ''

  const html = layout(`
<p style="font-size:15px;margin:0 0 12px">Guten Tag ${esc(d.vorname)} ${esc(d.nachname)},</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px">vielen Dank für Ihre Anfrage zur Wärmepumpe! Ihre Angaben sind bei uns angekommen – Sie müssen nichts weiter tun.</p>
${foerderHtml}
<h3 style="font-size:15px;margin:20px 0 8px">So geht es weiter</h3>
<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">${schritte.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h3 style="font-size:15px;margin:20px 0 8px">Gerne schon bereitlegen</h3>
<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">${unterlagen.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<p style="font-size:14px;line-height:1.6;margin:20px 0 0">Wichtig: Bitte unterschreiben Sie keinen Vertrag ohne Förderklausel und beginnen Sie nicht mit Arbeiten, bevor der KfW-Antrag gestellt ist – darum kümmern wir uns gemeinsam.</p>
<p style="font-size:14px;line-height:1.6;margin:16px 0 0">Bei Fragen erreichen Sie uns unter <a href="tel:+4973453286" style="color:${BRAND};font-weight:bold">07345 3286</a> oder antworten Sie einfach auf diese E-Mail.</p>
<p style="font-size:14px;margin:20px 0 0">Herzliche Grüße<br><strong>Ihr Team von Haustechnik Frey</strong></p>
`)

  const text = [
    `Guten Tag ${d.vorname} ${d.nachname},`,
    '',
    'vielen Dank für Ihre Anfrage zur Wärmepumpe! Ihre Angaben sind bei uns angekommen.',
    '',
    ...(foerderung
      ? [`Erste Förderschätzung: ca. ${formatEuro(foerderung.zuschuss)} Zuschuss (${foerderung.satzSelbstgenutzt} %, unverbindlich).`, '']
      : []),
    'So geht es weiter:',
    ...schritte.map((s, i) => `${i + 1}. ${s}`),
    '',
    'Gerne schon bereitlegen:',
    ...unterlagen.map((s) => `- ${s}`),
    '',
    'Bei Fragen: 07345 3286 oder einfach auf diese E-Mail antworten.',
    '',
    'Herzliche Grüße',
    'Ihr Team von Haustechnik Frey',
  ].join('\n')

  return { subject, html, text }
}
