import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { SYSTEM_PROMPT } from "@/lib/energy-advisor/systemPrompt"
import { detectEmergency, EMERGENCY_RESPONSE } from "@/lib/energy-advisor/safetyRules"
import { detectLeadIntent } from "@/lib/energy-advisor/leadSchema"
import { selectModel } from "@/lib/energy-advisor/modelRouter"
import type { EnergyAdvisorRequest, EnergyAdvisorResponse } from "@/lib/energy-advisor/types"

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const body = (await req.json()) as EnergyAdvisorRequest
    const { messages, currentPage, userContext } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Keine Nachrichten übergeben." }, { status: 400 })
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? ""

    // Safety check runs before any model call
    if (detectEmergency(lastUserMessage)) {
      const response: EnergyAdvisorResponse = {
        answer: EMERGENCY_RESPONSE,
        emergency: true,
        leadIntent: false,
      }
      return NextResponse.json(response)
    }

    const leadIntent = detectLeadIntent(lastUserMessage)
    const model = selectModel(messages)

    // Build context hint from currentPage / userContext
    let contextHint = ""
    if (currentPage) contextHint += `\nAktuelle Seite des Nutzers: ${currentPage}`
    if (userContext && Object.keys(userContext).length > 0) {
      contextHint += `\nNutzerkontext: ${JSON.stringify(userContext)}`
    }

    const instructions = contextHint ? `${SYSTEM_PROMPT}\n${contextHint}` : SYSTEM_PROMPT

    // OpenAI Responses API
    const completion = await openai.responses.create({
      model,
      instructions,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: 600,
    })

    const answer = completion.output_text.trim()

    // Derive suggestedNextStep from answer heuristics
    const suggestedNextStep = deriveSuggestedNextStep(lastUserMessage, answer)

    const response: EnergyAdvisorResponse = {
      answer,
      suggestedNextStep,
      leadIntent,
      emergency: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("EnergyAdvisor API Error:", error)
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut oder ruf uns direkt an: 07345 3286." },
      { status: 500 }
    )
  }
}

function deriveSuggestedNextStep(userMessage: string, answer: string): string | undefined {
  const combined = (userMessage + " " + answer).toLowerCase()
  if (combined.includes("wärmepumpe")) return "Heizungsrechner nutzen oder direkt anfragen"
  if (combined.includes("bad") && (combined.includes("modern") || combined.includes("sanieren") || combined.includes("renovieren")))
    return "KI-Badplaner ausprobieren oder Foto einsenden"
  if (combined.includes("förder")) return "Persönliche Förderprüfung anfragen"
  if (combined.includes("heizung") || combined.includes("gas") || combined.includes("öl"))
    return "Heizungsrechner nutzen oder Beratungsgespräch vereinbaren"
  if (combined.includes("kontakt") || combined.includes("angebot") || combined.includes("termin"))
    return "Direkt anrufen oder Kontaktformular nutzen"
  return undefined
}
