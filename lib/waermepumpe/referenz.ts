// Referenzprojekt für /waermepumpe – „Aus unserer Praxis“.
// Der Abschnitt wird angezeigt, sobald Bilder oder Schritte eingetragen sind.
// Bilder nach public/images/referenz-weishaupt/ legen (ca. 1600 px breit).
// Vor Veröffentlichung: Einverständnis des Kunden einholen; keine Gesichter, Hausnummern oder Kennzeichen.

export interface ReferenzBild {
  src: string
  alt: string
  titel: string
  text: string
}

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
  // Erstes Bild = großes Hauptbild (Hochformat), danach drei Querformate
  bilder: ReferenzBild[]
  schritte: ReferenzSchritt[]
  zitat?: { text: string; autor: string }
}

export const REFERENZ: Referenz = {
  titel: 'Frisch fertig: Weishaupt-Wärmepumpe im Bestand',
  einleitung:
    'Ein aktuelles Projekt aus unserer Region – Außengerät hinterm Haus, die Technik kompakt im Keller. Sauber verrohrt, gedämmt und in Betrieb genommen.',
  // Ergänzen, sobald bekannt: { label: 'Ort', wert: '…' }, { label: 'Vorher', wert: 'Ölheizung' }, { label: 'Einbauzeit', wert: '4 Tage' }
  fakten: [
    { label: 'Gerät', wert: 'Weishaupt Luft-Wasser' },
    { label: 'Gebäude', wert: 'Bestandsgebäude' },
    { label: 'Außen', wert: 'Auf Fundament am Haus' },
    { label: 'Keller', wert: 'Inneneinheit + Speicher' },
  ],
  bilder: [
    {
      src: '/images/referenz-weishaupt/01-aussengeraet.jpg',
      alt: 'Weishaupt Luft-Wasser-Wärmepumpe auf Betonfundament an der Hauswand',
      titel: 'Außengerät',
      text: 'Auf eigenem Fundament, mit Abstand zur Wand und Leitungsführung direkt ins Haus.',
    },
    {
      src: '/images/referenz-weishaupt/03-technikraum.jpg',
      alt: 'Technikraum im Keller mit Weishaupt-Inneneinheit, Warmwasserspeicher und gedämmten Leitungen',
      titel: 'Technikraum',
      text: 'Inneneinheit, Warmwasserspeicher und Ausdehnungsgefäß – alle Leitungen gedämmt.',
    },
    {
      src: '/images/referenz-weishaupt/02-aussengeraet-front.jpg',
      alt: 'Weishaupt Wärmepumpe von vorne im Garten',
      titel: 'Dezent im Garten',
      text: 'Anthrazit, kompakt – fügt sich unauffällig ein.',
    },
    {
      src: '/images/referenz-weishaupt/04-inneneinheit-speicher.jpg',
      alt: 'Weishaupt-Inneneinheit an der Wand neben dem Warmwasserspeicher',
      titel: 'Inneneinheit & Speicher',
      text: 'Platzsparend an der Wand, Speicher direkt daneben.',
    },
  ],
  // Optional später: Bauablauf, z. B. { titel: 'Ausgangslage', text: '…', bild: '/images/referenz-weishaupt/…', bildAlt: '…' }
  schritte: [],
}

export const referenzVorhanden = REFERENZ.bilder.length > 0 || REFERENZ.schritte.length > 0
