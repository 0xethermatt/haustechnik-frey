// Notfall-Erkennung vor jedem Modell-Aufruf. Muster bewusst eng gefasst:
// Teilwörter wie „Haushalt“ (… aus …), „Verbrauch“ (… rauch …) oder „Brandschutz“
// dürfen normale Beratungsfragen nicht als Notfall abfangen.
const EMERGENCY_PATTERNS = [
  /gas\s*geruch|riecht\w*\s+(?:\w+\s+){0,3}nach\s+gas\b|gasleck|gas\s+(?:tritt|strömt)\s+aus/i,
  /wasserrohrbruch|\brohrbruch|rohr\w*\s+(?:ist\s+)?(?:geplatzt|gebrochen)|wasserschaden|wasser\s+läuft\s+aus|überschwemm/i,
  /heizung\w*\s+(?:ist\s+|geht\s+)?(?:ausgefallen|kaputt|defekt)\b|heizungsausfall|heizung\w*\s+(?:geht|springt)\s+nicht\s+(?:mehr\s+)?an\b|\bkein(?:e|en)?\s+warm\w*\s*wasser\b|\bkein(?:e)?\s+heizung\s+mehr\b/i,
  /\bbrennt\b|\bbrand\b|\bfeuer\b|riecht\s+(?:\w+\s+)?verbrannt|\bqualm|rauch\s+(?:kommt|steigt|aus)\b/i,
  /stromausfall|kurzschluss|stromschlag/i,
  /\bnotfall\b|\bnotdienst\b|sofort\s+hilfe|dringend\s+hilfe/i,
]

export function detectEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text))
}

export const EMERGENCY_RESPONSE =
  "Das klingt nach einer Notsituation! Bitte rufen Sie uns sofort an: **07345 3286** (Mo–Fr 7–18 Uhr, Sa 8–13 Uhr). " +
  "Außerhalb der Geschäftszeiten wenden Sie sich bitte an den lokalen Notdienst oder die Feuerwehr (112). " +
  "Bitte verlassen Sie bei Gefahr (Gasgeruch, Brand) sofort das Gebäude."
