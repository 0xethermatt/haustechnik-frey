export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface EnergyAdvisorRequest {
  messages: ChatMessage[]
  currentPage?: string
  userContext?: Record<string, string>
}

export interface EnergyAdvisorResponse {
  answer: string
  suggestedNextStep?: string
  leadIntent?: boolean
  emergency?: boolean
}

export interface LeadData {
  name?: string
  ort?: string
  plz?: string
  gebaeudeArt?: string
  baujahr?: string
  wohnflaeche?: string
  energietraeger?: string
  jahresverbrauch?: string
  massnahme?: string
  zeithorizont?: string
  telefon?: string
  email?: string
}
