import { streamChatResponse, ChatMessage, ChatContext } from '@/services/ai/agent'
import { Locale } from '@/i18n/config'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      messages: ChatMessage[]
      context?: {
        userId?: string
        patientId?: string
        language?: string
      }
    }

    const { messages, context: rawContext } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert context to proper ChatContext type
    const context: ChatContext | undefined = rawContext ? {
      userId: rawContext.userId,
      patientId: rawContext.patientId,
      language: rawContext.language as Locale | undefined,
    } : undefined

    // Get streaming response from AI agent
    const result = await streamChatResponse(messages, context)

    // Return the stream
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
