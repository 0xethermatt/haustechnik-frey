export interface StarterQuestion {
  label: string
  message: string
}

export const STARTER_QUESTIONS: StarterQuestion[] = [
  {
    label: "Lohnt sich bei mir eine Wärmepumpe?",
    message: "Lohnt sich bei mir eine Wärmepumpe? Ich würde gerne wissen, ob mein Haus dafür geeignet ist.",
  },
  {
    label: "Was kostet ungefähr eine neue Heizung?",
    message: "Was kostet ungefähr eine neue Heizung? Ich suche grobe Richtwerte für eine Modernisierung.",
  },
  {
    label: "Ich möchte mein Bad modernisieren",
    message: "Ich möchte mein Bad modernisieren. Was würde das ungefähr kosten und wie läuft das ab?",
  },
  {
    label: "Welche Förderung könnte möglich sein?",
    message: "Welche Förderungen könnte ich für eine Heizungsmodernisierung oder Sanierung bekommen?",
  },
]
