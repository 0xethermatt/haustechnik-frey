import { FOERDER_STAND } from './foerderung'

export interface WPFaqItem {
  category: 'Eignung' | 'Förderung' | 'Kosten' | 'Technik' | 'Ablauf'
  question: string
  answer: string
}

export const WP_FAQ: WPFaqItem[] = [
  {
    category: 'Eignung',
    question: 'Funktioniert eine Wärmepumpe auch im Altbau?',
    answer:
      'In den meisten Fällen ja. Entscheidend ist nicht das Baujahr, sondern die Vorlauftemperatur, die Ihr Haus am kältesten Tag braucht. Liegt sie bei maximal 55 °C, arbeitet eine moderne Luft-Wasser-Wärmepumpe wirtschaftlich. Oft reicht es, zwei oder drei Heizkörper gegen größere Modelle zu tauschen. Ob das bei Ihnen nötig ist, ermitteln wir mit einer raumweisen Heizlastberechnung.',
  },
  {
    category: 'Eignung',
    question: 'Brauche ich eine Fußbodenheizung?',
    answer:
      'Nein. Eine Fußbodenheizung ist ideal, aber kein Muss. Viele unserer Kunden heizen mit normalen Heizkörpern. Wichtig ist, dass die Heizflächen groß genug sind, um das Haus mit niedriger Vorlauftemperatur warm zu bekommen. Ein einfacher Test: Wird Ihr Haus im Winter auch mit auf 50–55 °C reduzierter Vorlauftemperatur warm, ist es gut geeignet.',
  },
  {
    category: 'Eignung',
    question: 'Wie laut ist eine Wärmepumpe?',
    answer:
      'Moderne Außeneinheiten sind in wenigen Metern Abstand etwa so laut wie ein Kühlschrank. Für die Förderung muss das Gerät seit 2026 die gesetzlichen Lärmgrenzwerte um mindestens 10 dB unterschreiten. Wir planen den Aufstellort so, dass Schlafzimmer – Ihre und die Ihrer Nachbarn – nicht beeinträchtigt werden, und erstellen bei Bedarf einen Schallnachweis.',
  },
  {
    category: 'Förderung',
    question: 'Wie viel Förderung bekomme ich für eine Wärmepumpe?',
    answer: `Über die KfW-Heizungsförderung (Programm 458, Stand ${FOERDER_STAND}) gibt es 30 % Grundförderung. Selbstnutzende Eigentümer erhalten zusätzlich den Klimageschwindigkeitsbonus von aktuell 16 %, wenn eine funktionierende Öl-, Kohle-, Nachtspeicher- oder Gasetagenheizung oder eine mindestens 20 Jahre alte Gasheizung ersetzt wird. Dazu kommt ein Einkommensbonus von 40 %, 30 % oder 10 % bei einem zu versteuernden Haushaltseinkommen bis 30.000, 40.000 bzw. 50.000 €. Insgesamt sind maximal 70 % möglich, bei niedrigem Einkommen 80 %. Förderfähig sind bis zu 28.000 € für die erste Wohneinheit – also bis zu 22.400 € Zuschuss.`,
  },
  {
    category: 'Förderung',
    question: 'Sinkt die Förderung bald?',
    answer:
      'Ja. Der Klimageschwindigkeitsbonus sinkt halbjährlich: ab 01.02.2027 auf 12 %, ab 01.08.2027 auf 8 %, ab 01.02.2028 auf 4 % und entfällt ab 01.08.2028. Gleichzeitig sinken die förderfähigen Kosten der ersten Wohneinheit alle sechs Monate um 750 €. Für 2027 ist außerdem angekündigt, die Grundförderung für Wärmepumpen auf 15 % zu senken und einen Bonus für in der EU gefertigte Geräte einzuführen. Entscheidend ist der Zeitpunkt der Antragstellung – wer früher beantragt, sichert sich die höheren Sätze.',
  },
  {
    category: 'Förderung',
    question: 'Was zählt beim Einkommensbonus – und was ist der Familienzuschlag?',
    answer:
      'Maßgeblich ist das zu versteuernde Einkommen (zvE) aller Haushaltsmitglieder, gemittelt über das zweite und dritte Jahr vor Antragstellung – für Anträge 2026 also die Steuerbescheide 2023 und 2024. Lebt mindestens ein minderjähriges Kind im Haushalt, wird das zvE einmalig um 10.000 € reduziert. Das zvE liegt meist deutlich unter dem Bruttoeinkommen – viele Haushalte sind überrascht, dass sie Anspruch haben.',
  },
  {
    category: 'Förderung',
    question: 'Wer stellt den Förderantrag – und wann?',
    answer:
      'Den Antrag stellen Sie selbst im KfW-Portal „Meine KfW“ – wir bereiten alles vor. Die Reihenfolge ist wichtig: Zuerst schließen wir einen Liefer- und Leistungsvertrag mit einer Förderklausel (auflösende oder aufschiebende Bedingung) und stellen Ihnen die „Bestätigung zum Antrag“ (BzA) aus. Dann stellen Sie den Antrag, und erst nach der Zusage beginnen wir mit dem Einbau. So tragen Sie kein Risiko.',
  },
  {
    category: 'Kosten',
    question: 'Was kostet eine Wärmepumpe inklusive Einbau?',
    answer:
      'Für ein typisches Einfamilienhaus im Bestand liegt eine Luft-Wasser-Wärmepumpe inklusive Demontage der Altanlage, Speicher, Elektroanschluss und Inbetriebnahme meist zwischen 25.000 und 40.000 € vor Förderung. Erdwärmepumpen mit Bohrung kosten mehr, arbeiten dafür noch effizienter. Nach Abzug von 50–70 % Förderung bleibt oft ein Eigenanteil im Bereich einer neuen Gas- oder Ölheizung. Ein verbindliches Angebot erstellen wir nach dem Vor-Ort-Termin.',
  },
  {
    category: 'Kosten',
    question: 'Wie hoch sind die Stromkosten einer Wärmepumpe?',
    answer:
      'Faustregel: Aus 1 kWh Strom macht eine gute Wärmepumpe 3 bis 4 kWh Wärme. Ein Haus, das bisher 2.000 Liter Heizöl verbraucht hat, benötigt mit Wärmepumpe etwa 4.500–5.500 kWh Strom pro Jahr. Mit einem Wärmepumpentarif und eventuell eigener PV-Anlage liegen die Heizkosten meist deutlich unter denen von Öl oder Gas. Rechnen Sie es mit unserem Einsparrechner auf dieser Seite für Ihr Haus durch.',
  },
  {
    category: 'Technik',
    question: 'Luft-Wasser oder Erdwärme – was ist besser?',
    answer:
      'Die Luft-Wasser-Wärmepumpe ist für die meisten Bestandsgebäude die wirtschaftlichste Lösung: geringere Investition, keine Bohrung, schnelle Installation. Erdwärme (Sole-Wasser) ist effizienter und leiser, braucht aber eine genehmigungspflichtige Bohrung und ein ausreichend großes Grundstück. Wir beraten Sie ehrlich, was sich für Ihr Haus rechnet.',
  },
  {
    category: 'Technik',
    question: 'Lohnt sich eine Wärmepumpe mit Photovoltaik?',
    answer:
      'Ja, die Kombination ist sinnvoll – aber realistisch betrachtet: Die Wärmepumpe braucht den meisten Strom im Winter, wenn die PV-Anlage wenig erzeugt. Typischerweise deckt PV 15–30 % des Wärmepumpenstroms, im Sommer übernimmt sie das Warmwasser fast vollständig. Mit intelligenter Steuerung (SG-Ready) holen wir das Maximum heraus.',
  },
  {
    category: 'Technik',
    question: 'Muss mein Zählerschrank erneuert werden?',
    answer:
      'Das hängt vom Alter und Zustand ab. Ältere Zählerschränke erfüllen oft nicht die heutigen Anforderungen (z. B. Platz für einen zweiten Zähler oder Smart-Meter-Gateway). Senden Sie uns einfach ein Foto Ihres Zählerschranks über den Wärmepumpen-Check – dann können wir das vorab einschätzen und im Angebot berücksichtigen.',
  },
  {
    category: 'Ablauf',
    question: 'Wie lange dauert der Einbau?',
    answer:
      'Der eigentliche Einbau dauert bei einer Luft-Wasser-Wärmepumpe in der Regel 3 bis 5 Arbeitstage. Sie sind dabei meist nur kurz ohne Heizung und Warmwasser. Vom ersten Gespräch bis zur Inbetriebnahme sollten Sie – inklusive Förderzusage – etwa 2 bis 4 Monate einplanen.',
  },
  {
    category: 'Ablauf',
    question: 'Was muss ich für das Erstgespräch vorbereiten?',
    answer:
      'Hilfreich sind: Ihr Verbrauch der letzten 2–3 Jahre (Liter Öl, m³ oder kWh Gas), ein Foto vom Typenschild der aktuellen Heizung, ein Foto vom Zählerschrank, ein Foto des möglichen Aufstellorts und – falls vorhanden – Grundrisse. Alles davon können Sie direkt im Wärmepumpen-Check hochladen. Das spart einen Termin.',
  },
]
