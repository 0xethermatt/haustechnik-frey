const EMERGENCY_PATTERNS = [
  /gas.*geruch|geruch.*gas|gasleitung|gasleck|riecht.*gas|gas.*riecht/i,
  /wasserrohrbruch|rohrbruch|rohr.*gebrochen|gebrochen.*rohr/i,
  /wasserschaden|wasser.*läuft.*aus|wasser.*läuft aus|überschwemmung/i,
  /heizung.*ausgefallen|heizung.*kaputt|heizung.*aus|keine.*heizung|heizungsausfall/i,
  /brand|feuer|rauch.*heizung|heizung.*rauch/i,
  /schimmel.*gesundheit|gesundheit.*schimmel|schimmel.*schlimm/i,
  /stromausfall|kurzschluss|strom.*gefahr|elektrisch.*gefahr/i,
  /notfall|notdienst|sofort.*hilfe|dringend.*hilfe/i,
]

export function detectEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text))
}

export const EMERGENCY_RESPONSE =
  "Das klingt nach einer Notsituation! Bitte rufen Sie uns sofort an: **07345 3286** (Mo–Fr 7–18 Uhr, Sa 8–13 Uhr). " +
  "Außerhalb der Geschäftszeiten wenden Sie sich bitte an den lokalen Notdienst oder die Feuerwehr (112). " +
  "Bitte verlassen Sie bei Gefahr (Gasgeruch, Brand) sofort das Gebäude."
