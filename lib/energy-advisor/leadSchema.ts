const LEAD_INTENT_PATTERNS = [
  /angebot/i,
  /termin/i,
  /könn(t|en).*(vorbeikommen|bei mir|zu mir)/i,
  /bei mir (einbauen|installieren|montieren)/i,
  /modernisieren lassen|sanieren lassen|renovieren lassen/i,
  /ich möchte/i,
  /preis für mein/i,
  /was kostet.*bei mir/i,
  /können sie.*machen|macht ihr.*bei mir/i,
  /beauftragen|beauftrage/i,
  /kontakt.*aufnehmen|in kontakt treten/i,
  /anfrage stellen|anfragen/i,
]

export function detectLeadIntent(text: string): boolean {
  return LEAD_INTENT_PATTERNS.some((pattern) => pattern.test(text))
}
