'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Phone, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { STARTER_QUESTIONS } from './starterQuestions'
import type { ChatMessage, EnergyAdvisorResponse } from '@/lib/energy-advisor/types'

interface DisplayMessage extends ChatMessage {
  meta?: Pick<EnergyAdvisorResponse, 'suggestedNextStep' | 'emergency' | 'leadIntent'>
}

export default function EnergyAdvisorChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setError(null)

    const userMsg: DisplayMessage = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/energy-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })

      if (!res.ok) throw new Error('Serverantwort fehlgeschlagen')
      const data = (await res.json()) as EnergyAdvisorResponse

      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: data.answer,
        meta: {
          suggestedNextStep: data.suggestedNextStep,
          emergency: data.emergency,
          leadIntent: data.leadIntent,
        },
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setError('Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut oder ruf uns direkt an.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showStarters = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {/* Welcome */}
        {showStarters && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-purple flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                F
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-card max-w-xs">
                <p className="text-sm text-brand-purple-deep leading-relaxed">
                  Hallo! Ich bin Ihr digitaler Energie- und Sanierungsberater von Haustechnik Frey. Womit kann ich Ihnen helfen?
                </p>
              </div>
            </div>

            {/* Starter questions */}
            <div className="pl-11 flex flex-col gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.message)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all duration-200 font-medium"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-purple flex-shrink-0 flex items-center justify-center text-white text-xs font-bold self-end">
                F
              </div>
            )}

            <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-purple text-white rounded-tr-sm'
                    : 'bg-white text-brand-purple-deep shadow-card rounded-tl-sm'
                }`}
              >
                {/* Emergency banner */}
                {msg.meta?.emergency && (
                  <div className="flex items-center gap-2 mb-2 text-red-600 font-semibold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs uppercase tracking-wide">Notfall</span>
                  </div>
                )}
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>

              {/* Suggested next step */}
              {msg.meta?.suggestedNextStep && !msg.meta.emergency && (
                <div className="flex items-center gap-1.5 text-xs text-brand-orange font-medium px-1">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>{msg.meta.suggestedNextStep}</span>
                </div>
              )}

              {/* Emergency phone CTA */}
              {msg.meta?.emergency && (
                <a
                  href="tel:+4973453286"
                  className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  07345 3286 — Jetzt anrufen
                </a>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-purple flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              F
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-card flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-purple animate-spin" />
              <span className="text-sm text-brand-purple-deep/60">Einen Moment …</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-red-700 max-w-[80%]">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-brand-purple/10 px-4 py-3 bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ihre Frage …"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none text-sm text-brand-purple-deep placeholder:text-brand-purple-deep/40 bg-brand-warm rounded-xl px-4 py-3 border border-brand-purple/10 focus:outline-none focus:border-brand-purple/40 disabled:opacity-50 transition-colors leading-relaxed"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-purple hover:bg-brand-purple-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200"
            aria-label="Senden"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-brand-purple-deep/30 mt-2">
          Keine verbindlichen Angebote · Förderangaben unverbindlich
        </p>
      </div>
    </div>
  )
}
