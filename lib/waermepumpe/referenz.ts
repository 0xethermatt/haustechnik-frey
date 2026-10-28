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
  titel: 'Echte Anlagen, echte Handarbeit',
  einleitung:
    'Weishaupt-Wärmepumpen, die wir zuletzt fertiggestellt haben – keine Katalogbilder. Außengerät am Haus, Technik kompakt im Keller, jede Leitung gedämmt und beschriftet.',
  // Pro Projekt ergänzbar: { label: 'Ort', wert: '…' }, { label: 'Vorher', wert: 'Ölheizung' }, { label: 'Einbauzeit', wert: '4 Tage' }
  fakten: [
    { label: 'Hersteller', wert: 'Weishaupt' },
    { label: 'System', wert: 'Luft-Wasser-Wärmepumpe' },
    { label: 'Leitungen', wert: 'Gedämmt & beschriftet' },
    { label: 'Ausführung', wert: 'Eigener Meisterbetrieb' },
  ],
  // Reihenfolge = Layout: [0] Hochformat links, [1] breit, [2] + [3] klein, [4] Hochformat rechts
  bilder: [
    {
      src: '/images/referenz-weishaupt/01-aussengeraet.jpg',
      alt: 'Weishaupt Luft-Wasser-Wärmepumpe auf Betonfundament an der Hauswand',
      titel: 'Außengerät',
      text: 'Auf eigenem Fundament, Leitungsführung direkt ins Haus.',
    },
    {
      src: '/images/referenz-weishaupt/03-technikraum-hell.jpg',
      alt: 'Technikraum mit Weishaupt-Inneneinheit, Warmwasserspeicher, Ausdehnungsgefäß und gedämmten Leitungen',
      titel: 'Technikraum',
      text: 'Inneneinheit, Warmwasserspeicher und Ausdehnungsgefäß – aufgeräumt und wartungsfreundlich.',
    },
    {
      src: '/images/referenz-weishaupt/04-hydraulik-detail.jpg',
      alt: 'Gedämmte und beschriftete Heizungsleitungen mit Absperrhähnen unter der Weishaupt-Inneneinheit',
      titel: 'Sauber verrohrt',
      text: 'Jede Leitung gedämmt und beschriftet.',
    },
    {
      src: '/images/referenz-weishaupt/02-aussengeraet-front.jpg',
      alt: 'Weishaupt Wärmepumpe von vorne im Garten',
      titel: 'Dezent im Garten',
      text: 'Anthrazit und kompakt.',
    },
    {
      src: '/images/referenz-weishaupt/05-inneneinheit.jpg',
      alt: 'Weishaupt-Inneneinheit an der Kellerwand mit Leitungsführung und Ausdehnungsgefäß',
      titel: 'Inneneinheit',
      text: 'Platzsparend an der Wand montiert.',
    },
  ],
  // Bauablauf eines Projekts (Gastherme → Weishaupt-Wärmepumpe)
  schritte: [
    {
      titel: 'Ausgangslage',
      text: 'Die alte Gastherme hat ausgedient – wir bauen sie fachgerecht aus.',
      bild: '/images/referenz-weishaupt/ablauf-1-vorher.jpg',
      bildAlt: 'Monteur demontiert die alte Gas-Brennwerttherme',
    },
    {
      titel: 'Fundament',
      text: 'Aushub, Schotterbett, exakt nivelliert – die Basis fürs Außengerät.',
      bild: '/images/referenz-weishaupt/ablauf-2-fundament.jpg',
      bildAlt: 'Aushub und Schotterbett für das Fundament der Wärmepumpe',
    },
    {
      titel: 'Montage im Keller',
      text: 'Inneneinheit ausgerichtet, Leitungen verlegt und gedämmt.',
      bild: '/images/referenz-weishaupt/ablauf-3-montage.jpg',
      bildAlt: 'Neu montierte Inneneinheit mit Wasserwaage und frisch verlegten Leitungen',
    },
    {
      titel: 'Außengerät',
      text: 'Auf Betonsockeln, mit freiem Ablauf fürs Kondensat.',
      bild: '/images/referenz-weishaupt/ablauf-4-aussengeraet.jpg',
      bildAlt: 'Weishaupt-Außengerät auf Betonsockeln vor der Hauswand',
    },
    {
      titel: 'Fertig',
      text: 'Inneneinheit, Speicher und Ausdehnungsgefäß – sauber übergeben.',
      bild: '/images/referenz-weishaupt/ablauf-5-fertig.jpg',
      bildAlt: 'Fertiger Technikraum mit Weishaupt-Inneneinheit und Warmwasserspeicher',
    },
  ],
}

export const referenzVorhanden = REFERENZ.bilder.length > 0 || REFERENZ.schritte.length > 0
