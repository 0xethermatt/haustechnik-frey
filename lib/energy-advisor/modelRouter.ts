import { ChatMessage } from "./types"

const DEFAULT_MODEL = process.env.ENERGY_ADVISOR_MODEL ?? "gpt-5.4-mini"
const ESCALATION_MODEL = process.env.ENERGY_ADVISOR_ESCALATION_MODEL ?? "gpt-5.5"

// Topics that warrant the more capable model
const ESCALATION_PATTERNS = [
  /förder(ung|ungen|mittel)|bafa|kfw|bundesförderung/i,
  /wärmepumpe.*vergleich|vergleich.*wärmepumpe/i,
  /sanierungsfahrplan|energieausweis/i,
  /vollsanierung|kernsanierung/i,
  /wirtschaftlichkeit.*berechnung|berechnung.*wirtschaftlichkeit/i,
  /amortisation|rendite.*heizung/i,
  /hybridheizung|kombination.*heizung/i,
  /photovoltaik.*wärmepumpe|wärmepumpe.*photovoltaik/i,
]

export function selectModel(messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
  const allUserText = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ")

  const needsEscalation =
    ESCALATION_PATTERNS.some((p) => p.test(lastUserMessage)) ||
    (messages.length > 6 && ESCALATION_PATTERNS.some((p) => p.test(allUserText)))

  return needsEscalation ? ESCALATION_MODEL : DEFAULT_MODEL
}
