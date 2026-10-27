import { BRAND, esc, layout, prioBadge, sectionHeading, table, type Prioritaet, type Row } from '@/lib/mail/template'
import { DRINGLICHKEIT, ERREICHBARKEIT, THEMEN, labelVon, type KontaktDaten } from './anfrage'

export function kontaktBuroEmail(d: KontaktDaten, prioritaet: Prioritaet, fotoNamen: string[]) {
  const thema = labelVon(THEMEN, d.thema)
  const subject = `${prioritaet === 'hoch' ? '[DRINGEND] ' : ''}Anfrage ${thema}: ${d.name}, ${d.plz} ${d.ort}`.trim()

  const rows: Row[] = [
    ['Thema', thema],
    ['Dringlichkeit', labelVon(DRINGLICHKEIT, d.dringlichkeit)],
    ['Name', d.name],
    ['Telefon', d.telefon],
    ['E-Mail', d.email || '–'],
    ['Adresse', [d.strasse, `${d.plz} ${d.ort}`.trim()].filter(Boolean).join(', ')],
    ['Erreichbar', labelVon(ERREICHBARKEIT, d.erreichbarkeit)],
  ]

  const html = layout(
    'Neue Anfrage über die Website',
    `${prioBadge(prioritaet)}
<h2 style="margin:12px 0 4px;font-size:20px">${esc(d.name)} · ${esc(d.plz)} ${esc(d.ort)}</h2>
<p style="margin:0 0 16px;font-size:14px"><a href="tel:${esc(d.telefon.replace(/[^\d+]/g, ''))}" style="color:${BRAND};font-weight:bold">${esc(d.telefon)}</a>${d.email ? ` · <a href="mailto:${esc(d.email)}" style="color:${BRAND}">${esc(d.email)}</a>` : ''}</p>
${sectionHeading('Anliegen')}
<p style="font-size:14px;white-space:pre-wrap;margin:0">${esc(d.nachricht)}</p>
${sectionHeading('Details')}
<table style="border-collapse:collapse;width:100%">${table(rows)}</table>
<p style="font-size:13px;color:#6b7280;margin-top:20px">Fotos: ${fotoNamen.length ? esc(fotoNamen.join(', ')) + ' (im Anhang)' : 'keine'}</p>`
  )

  const text = [
    `Neue Anfrage (${thema}) – ${labelVon(DRINGLICHKEIT, d.dringlichkeit)}`,
    '',
    d.nachricht,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    `Fotos: ${fotoNamen.length ? fotoNamen.join(', ') : 'keine'}`,
  ].join('\n')

  return { subject, html, text }
}

export function kontaktKundenEmail(d: KontaktDaten) {
  const subject = 'Ihre Anfrage bei Haustechnik Frey'
  const vorname = d.name.split(' ')[0]
  const html = layout(
    'Ihre Anfrage ist angekommen',
    `<p style="font-size:15px;margin:0 0 12px">Guten Tag ${esc(d.name)},</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px">vielen Dank für Ihre Anfrage zum Thema <strong>${esc(labelVon(THEMEN, d.thema))}</strong>. Wir melden uns in der Regel innerhalb von 1–2 Werktagen telefonisch bei Ihnen.</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Ist es dringend – etwa bei Heizungsausfall oder Wasserschaden? Dann rufen Sie uns bitte direkt an: <a href="tel:+4973453286" style="color:${BRAND};font-weight:bold">07345 3286</a>.</p>
<p style="font-size:14px;margin:20px 0 0">Herzliche Grüße<br><strong>Ihr Team von Haustechnik Frey</strong></p>`
  )
  const text = [
    `Guten Tag ${vorname},`,
    '',
    `vielen Dank für Ihre Anfrage (${labelVon(THEMEN, d.thema)}). Wir melden uns in der Regel innerhalb von 1–2 Werktagen.`,
    'Dringend? Bitte direkt anrufen: 07345 3286',
    '',
    'Herzliche Grüße',
    'Ihr Team von Haustechnik Frey',
  ].join('\n')
  return { subject, html, text }
}
