// Referenzprojekt für /waermepumpe – „Aus unserer Praxis“.
// Der Abschnitt wird erst angezeigt, wenn mindestens ein Schritt mit Bild eingetragen ist.
// Bilder nach public/images/referenz-weishaupt/ legen (Querformat, ca. 1600 px breit).
// Vor Veröffentlichung: Einverständnis des Kunden einholen; keine Gesichter, Hausnummern oder Kennzeichen.

export interface ReferenzSchritt {
  titel: string
  text: string
  bild: string
  bildAlt: string
}

export interface Referenz {
  titel: string
  einleitung: string
  fakten: { label: string; wert: string }[]
  schritte: ReferenzSchritt[]
  zitat?: { text: string; autor: string }
}

export const REFERENZ: Referenz = {
  titel: 'Weishaupt-Wärmepumpe im Bestand – Schritt für Schritt',
  einleitung:
    'So sieht ein Heizungstausch bei uns aus: von der alten Anlage bis zur fertig eingebauten Wärmepumpe.',
  // z. B. { label: 'Ort', wert: 'Langenau' }, { label: 'Baujahr Haus', wert: '1985' },
  // { label: 'Vorher', wert: 'Ölheizung' }, { label: 'Gerät', wert: 'Weishaupt …' }, { label: 'Einbauzeit', wert: '4 Tage' }
  fakten: [],
  // z. B. { titel: 'Ausgangslage', text: '…', bild: '/images/referenz-weishaupt/01-vorher.jpg', bildAlt: 'Alte Ölheizung im Keller' }
  schritte: [],
}
