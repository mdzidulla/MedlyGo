/**
 * AI Chat Agent Service
 * Handles patient inquiries using Claude AI
 */

import { streamText, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { Locale } from '@/i18n/config'

// System prompt for the MedlyGo assistant
const SYSTEM_PROMPT = `You are MedlyBot, a friendly and helpful AI assistant for MedlyGo - a hospital appointment booking platform serving public hospitals in Ghana.

Your primary responsibilities:
1. Help patients find and book appointments at public hospitals
2. Answer questions about hospital locations, departments, and services
3. Assist with appointment rescheduling and cancellations
4. Provide general healthcare information (but NOT medical advice)
5. Guide users through the booking process

Important guidelines:
- Be warm, professional, and empathetic
- Use simple, clear language
- Support both English and local Ghanaian languages (Twi, Ga, Ewe, Hausa) when needed
- Never provide medical diagnoses or treatment advice
- Always recommend visiting a healthcare professional for medical concerns
- Be concise but thorough in your responses
- If you don't know something, admit it and suggest alternatives

Common phrases in Twi you might use:
- "Akwaaba" (Welcome)
- "Medaase" (Thank you)
- "Ɛyɛ" (It's good/Okay)

Hospital information:
- We partner with major public hospitals across Ghana including Korle Bu Teaching Hospital, Komfo Anokye Teaching Hospital, and regional hospitals
- Appointments can be booked for various departments including General Medicine, Pediatrics, Obstetrics & Gynecology, Cardiology, Orthopedics, etc.
- Booking is free, but standard hospital consultation fees apply

When users want to book an appointment:
1. Ask which hospital or area they prefer
2. Ask what department/specialty they need
3. Suggest they use the booking feature on the website: /book
4. Remind them to bring valid ID and any referral documents

For checking appointments:
- Ask for their reference number
- Direct them to the dashboard: /dashboard
`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatContext {
  userId?: string
  patientId?: string
  language?: Locale
}

/**
 * Create a streaming chat response
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  context?: ChatContext
) {
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  return result
}

/**
 * Generate a single chat response (non-streaming)
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  const result = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  return result.text
}

/**
 * Quick response templates for common questions
 */
export const quickResponses = {
  greeting: {
    en: "Akwaaba! Welcome to MedlyGo. I'm MedlyBot, your AI assistant. How can I help you today? Would you like to book an appointment, check an existing booking, or learn about our partner hospitals?",
    tw: "Akwaaba! Yɛma wo akwaaba wɔ MedlyGo. Meyɛ MedlyBot. Ɛdeɛn na metumi aboa wo ɛnnɛ?",
  },
  bookingHelp: "To book an appointment:\n1. Tell me which hospital or area you're looking for\n2. I'll help you find available departments\n3. Choose your preferred date and time\n4. Confirm your booking\n\nWould you like to start searching for a hospital?",
  cancellationPolicy: "You can cancel or reschedule your appointment up to 4 hours before the scheduled time. To cancel, go to your dashboard or provide your reference number and I'll help you.",
  emergencyDisclaimer: "⚠️ If you're experiencing a medical emergency, please call Ghana Emergency Services at 112 or go to the nearest hospital emergency room immediately. This booking platform is for non-emergency appointments only.",
}
