// Gemeinsames HTML-Layout für Büro- und Kundenmails

export const BRAND = '#6B2D8B'
export const ORANGE = '#E8A030'

export type Row = [string, string]

export type Prioritaet = 'hoch' | 'mittel' | 'normal'

export const PRIO_STYLE: Record<Prioritaet, { label: string; bg: string; fg: string }> = {
  hoch: { label: 'PRIORITÄT HOCH', bg: '#FEE2E2', fg: '#B91C1C' },
  mittel: { label: 'Priorität mittel', bg: '#FEF3C7', fg: '#92400E' },
  normal: { label: 'Priorität normal', bg: '#E5E7EB', fg: '#374151' },
}

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function table(rows: Row[]): string {
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#111827;font-size:14px">${esc(v)}</td></tr>`
    )
    .join('')
}

export function sectionHeading(title: string): string {
  return `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${BRAND};margin:20px 0 6px">${esc(title)}</h3>`
}

export function prioBadge(p: Prioritaet): string {
  const s = PRIO_STYLE[p]
  return `<div style="display:inline-block;background:${s.bg};color:${s.fg};font-weight:bold;font-size:12px;padding:4px 10px;border-radius:999px">${s.label}</div>`
}

export function layout(titel: string, inner: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#FAF8F6;font-family:Arial,Helvetica,sans-serif;color:#2D1140">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
<div style="background:#2D1140;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0">
<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ORANGE};font-weight:bold">Haustechnik Frey</div>
<div style="font-size:20px;font-weight:bold;margin-top:4px">${esc(titel)}</div>
</div>
<div style="background:#fff;padding:24px;border-radius:0 0 16px 16px;border:1px solid #eee;border-top:0">${inner}</div>
<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:16px">Haustechnik Andreas Frey · Schammenstraße 19 · 89129 Langenau · 07345 3286</p>
</div></body></html>`
}
