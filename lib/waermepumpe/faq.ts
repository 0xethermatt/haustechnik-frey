import { FOERDER_STAND, UMSETZUNGSFRIST_MONATE } from './foerderung'

export interface WPFaqItem {
  category: 'Eignung' | 'Förderung' | 'Kosten' | 'Technik' | 'Ablauf'
  question: string
  answer: string
}

export const WP_FAQ: WPFaqItem[] = [
  {
    category: 'Förderung',
    question: 'Wie viel Förderung bekomme ich für eine Wärmepumpe?',
    answer: `Über die KfW-Heizungsförderung (Programm 458, Stand ${FOERDER_STAND}) gibt es 30 % Grundförderung. Selbstnutzende Eigentümer erhalten zusätzlich den Klimageschwindigkeitsbonus von aktuell 16 %, wenn eine funktionierende Öl-, Kohle-, Nachtspeicher- oder Gasetagenheizung oder eine mindestens 20 Jahre alte Gasheizung ersetzt wird. Dazu kommt ein Einkommensbonus von 40 %, 30 % oder 10 % bei einem zu versteuernden Haushaltseinkommen bis 30.000, 40.000 bzw. 50.000 €. Insgesamt sind maximal 70 % möglich, bei niedrigem Einkommen 80 %. Förderfähig sind bis zu 28.000 € für die erste Wohneinheit – also bis zu 22.400 € Zuschuss.`,
  },
  {
    category: 'Förderung',
    question: 'Muss ich sofort einbauen, wenn ich die Förderung beantrage?',
    answer: `Nein. Maßgeblich für die Förderhöhe ist der Zeitpunkt der Antragstellung – wer jetzt beantragt, sichert sich die aktuellen Sätze, bevor sie sinken. Nach der Förderzusage haben Sie ${UMSETZUNGSFRIST_MONATE} Monate Zeit, die Wärmepumpe einbauen zu lassen. Voraussetzung für den Antrag ist ein Liefer- und Leistungsvertrag mit Förderklausel: Kommt keine Zusage, ist der Vertrag hinfällig – Sie gehen also kein Risiko ein.`,
  },
  {
    category: 'Kosten',
    question: 'Was kostet eine Wärmepumpe inklusive Einbau?',
    answer:
      'Das ist von Haus zu Haus sehr unterschiedlich – entscheidend sind Heizlast, vorhandene Heizkörper, Aufstellort und Elektrik. Seriös lässt sich der Preis deshalb erst nach einem Vor-Ort-Termin nennen; den bieten wir kostenlos an. Klar ist: Die KfW übernimmt bis zu 70 %, bei niedrigem Einkommen bis zu 80 % der förderfähigen Kosten. Nach Förderung liegt der Eigenanteil oft im Bereich einer neuen Gas- oder Ölheizung.',
  },
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
    question: 'Wie hoch sind die Stromkosten einer Wärmepumpe?',
    answer:
      'Faustregel: Aus 1 kWh Strom macht eine gute Wärmepumpe 3 bis 4 kWh Wärme. Ein Haus, das bisher 2.000 Liter Heizöl verbraucht hat, benötigt mit Wärmepumpe etwa 4.500–5.500 kWh Strom pro Jahr. Mit einem Wärmepumpentarif und eventuell eigener PV-Anlage liegen die Heizkosten meist deutlich unter denen von Öl oder Gas. Rechnen Sie es mit unserem Einsparrechner auf dieser Seite für Ihr Haus durch.',
  },
  {
    category: 'Technik',
    question: 'Funktioniert eine Luft-Wasser-Wärmepumpe auch im Winter?',
    answer:
      'Ja. Moderne Luft-Wasser-Wärmepumpen heizen zuverlässig bis etwa −20 °C – auch in der Region Ulm und auf der Alb. Entscheidend ist die richtige Auslegung: Wir berechnen die Heizlast Ihres Hauses raumweise und wählen das Gerät so, dass es auch an den kältesten Tagen genug Wärme liefert. Der elektrische Heizstab springt nur an wenigen Extremtagen kurz an. Deshalb setzen wir ausschließlich auf Luft-Wasser-Wärmepumpen: keine Bohrung, keine Genehmigung, schneller Einbau.',
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
