/**
 * SMS Notification Service
 * Primary: Hubtel (Ghana local coverage)
 * Fallback: Twilio (global reliability)
 */

interface SMSResult {
  success: boolean
  messageId?: string
  provider: 'hubtel' | 'twilio'
  error?: string
}

interface SMSMessage {
  to: string
  message: string
  senderId?: string
}

// Hubtel SMS API
async function sendViaHubtel(sms: SMSMessage): Promise<SMSResult> {
  const clientId = process.env.HUBTEL_CLIENT_ID
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Hubtel credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await fetch('https://smsc.hubtel.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: sms.senderId || 'MEDLYGO',
        To: formatGhanaPhone(sms.to),
        Content: sms.message,
      }),
    })

    const data = await response.json()

    if (response.ok && data.MessageId) {
      return {
        success: true,
        messageId: data.MessageId,
        provider: 'hubtel',
      }
    }

    return {
      success: false,
      provider: 'hubtel',
      error: data.Message || 'Failed to send SMS via Hubtel',
    }
  } catch (error) {
    return {
      success: false,
      provider: 'hubtel',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Twilio SMS API (Fallback)
async function sendViaTwilio(sms: SMSMessage): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhone) {
    throw new Error('Twilio credentials not configured')
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formatInternationalPhone(sms.to),
          From: twilioPhone,
          Body: sms.message,
        }),
      }
    )

    const data = await response.json()

    if (response.ok && data.sid) {
      return {
        success: true,
        messageId: data.sid,
        provider: 'twilio',
      }
    }

    return {
      success: false,
      provider: 'twilio',
      error: data.message || 'Failed to send SMS via Twilio',
    }
  } catch (error) {
    return {
      success: false,
      provider: 'twilio',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Format phone number for Ghana (Hubtel)
function formatGhanaPhone(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')

  // If starts with 233, return as-is
  if (digits.startsWith('233')) {
    return digits
  }

  // If starts with 0, replace with 233
  if (digits.startsWith('0')) {
    return `233${digits.slice(1)}`
  }

  // Otherwise, prepend 233
  return `233${digits}`
}

// Format phone number for international (Twilio)
function formatInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  // If starts with 233, add +
  if (digits.startsWith('233')) {
    return `+${digits}`
  }

  // If starts with 0, assume Ghana
  if (digits.startsWith('0')) {
    return `+233${digits.slice(1)}`
  }

  // If no country code, assume Ghana
  if (digits.length <= 10) {
    return `+233${digits}`
  }

  return `+${digits}`
}

/**
 * Send SMS with automatic fallback
 * Tries Hubtel first (better Ghana coverage), falls back to Twilio
 */
export async function sendSMS(sms: SMSMessage): Promise<SMSResult> {
  // Try Hubtel first (primary provider for Ghana)
  try {
    const hubtelResult = await sendViaHubtel(sms)
    if (hubtelResult.success) {
      return hubtelResult
    }
    console.warn('Hubtel SMS failed, trying Twilio fallback:', hubtelResult.error)
  } catch (error) {
    console.warn('Hubtel SMS error, trying Twilio fallback:', error)
  }

  // Fallback to Twilio
  try {
    return await sendViaTwilio(sms)
  } catch (error) {
    return {
      success: false,
      provider: 'twilio',
      error: error instanceof Error ? error.message : 'All SMS providers failed',
    }
  }
}

// SMS Templates
export const smsTemplates = {
  bookingConfirmation: (data: {
    patientName: string
    hospital: string
    department: string
    date: string
    time: string
    referenceNumber: string
  }) => `
Hi ${data.patientName}, your appointment is confirmed!

Hospital: ${data.hospital}
Department: ${data.department}
Date: ${data.date}
Time: ${data.time}
Ref: ${data.referenceNumber}

To reschedule or cancel, visit medlygo.com or reply HELP.

- MedlyGo
`.trim(),

  reminder48Hours: (data: {
    patientName: string
    hospital: string
    date: string
    time: string
  }) => `
Reminder: ${data.patientName}, you have an appointment in 2 days.

${data.hospital}
${data.date} at ${data.time}

Reply YES to confirm, or visit medlygo.com to reschedule.

- MedlyGo
`.trim(),

  reminder24Hours: (data: {
    patientName: string
    hospital: string
    department: string
    date: string
    time: string
  }) => `
Reminder: Your appointment is tomorrow!

${data.hospital}
${data.department}
${data.date} at ${data.time}

Please arrive 15 minutes early. Bring your Ghana Card and any relevant medical documents.

- MedlyGo
`.trim(),

  reminder2Hours: (data: {
    patientName: string
    hospital: string
    time: string
  }) => `
${data.patientName}, your appointment at ${data.hospital} is in 2 hours at ${data.time}.

See you soon!
- MedlyGo
`.trim(),

  cancellation: (data: {
    patientName: string
    hospital: string
    date: string
  }) => `
Hi ${data.patientName}, your appointment at ${data.hospital} on ${data.date} has been cancelled.

To book a new appointment, visit medlygo.com

- MedlyGo
`.trim(),

  reschedule: (data: {
    patientName: string
    hospital: string
    oldDate: string
    newDate: string
    newTime: string
  }) => `
Hi ${data.patientName}, your appointment has been rescheduled.

${data.hospital}
New date: ${data.newDate} at ${data.newTime}

- MedlyGo
`.trim(),
}
