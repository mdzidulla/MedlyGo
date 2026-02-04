/**
 * Unified Notification Service
 * Handles both SMS and Email notifications for appointments
 */

import { sendSMS, smsTemplates } from './sms'
import { sendEmail, emailTemplates } from './email'
import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'booking_confirmation'
  | 'reminder_48h'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'cancellation'
  | 'reschedule'
  | 'feedback_request'

interface AppointmentData {
  patientName: string
  patientPhone: string
  patientEmail?: string
  hospital: string
  hospitalAddress: string
  department: string
  date: string
  time: string
  referenceNumber: string
  appointmentId: string
  preparationInstructions?: string
}

interface NotificationResult {
  sms?: {
    success: boolean
    messageId?: string
    error?: string
  }
  email?: {
    success: boolean
    messageId?: string
    error?: string
  }
}

/**
 * Send notification for an appointment
 */
export async function sendAppointmentNotification(
  type: NotificationType,
  data: AppointmentData,
  options: {
    sendSms?: boolean
    sendEmail?: boolean
  } = { sendSms: true, sendEmail: true }
): Promise<NotificationResult> {
  const result: NotificationResult = {}

  // Send SMS
  if (options.sendSms && data.patientPhone) {
    const smsMessage = getSmsMessage(type, data)
    if (smsMessage) {
      result.sms = await sendSMS({
        to: data.patientPhone,
        message: smsMessage,
      })
    }
  }

  // Send Email
  if (options.sendEmail && data.patientEmail) {
    const emailTemplate = getEmailTemplate(type, data)
    if (emailTemplate) {
      result.email = await sendEmail({
        to: data.patientEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      })
    }
  }

  // Log notification to database
  await logNotification(type, data, result)

  return result
}

function getSmsMessage(type: NotificationType, data: AppointmentData): string | null {
  switch (type) {
    case 'booking_confirmation':
      return smsTemplates.bookingConfirmation({
        patientName: data.patientName,
        hospital: data.hospital,
        department: data.department,
        date: data.date,
        time: data.time,
        referenceNumber: data.referenceNumber,
      })

    case 'reminder_48h':
      return smsTemplates.reminder48Hours({
        patientName: data.patientName,
        hospital: data.hospital,
        date: data.date,
        time: data.time,
      })

    case 'reminder_24h':
      return smsTemplates.reminder24Hours({
        patientName: data.patientName,
        hospital: data.hospital,
        department: data.department,
        date: data.date,
        time: data.time,
      })

    case 'reminder_2h':
      return smsTemplates.reminder2Hours({
        patientName: data.patientName,
        hospital: data.hospital,
        time: data.time,
      })

    case 'cancellation':
      return smsTemplates.cancellation({
        patientName: data.patientName,
        hospital: data.hospital,
        date: data.date,
      })

    default:
      return null
  }
}

function getEmailTemplate(
  type: NotificationType,
  data: AppointmentData
): { subject: string; html: string; text: string } | null {
  switch (type) {
    case 'booking_confirmation':
      return emailTemplates.bookingConfirmation({
        patientName: data.patientName,
        hospital: data.hospital,
        hospitalAddress: data.hospitalAddress,
        department: data.department,
        date: data.date,
        time: data.time,
        referenceNumber: data.referenceNumber,
      })

    case 'reminder_24h':
      return emailTemplates.reminder24Hours({
        patientName: data.patientName,
        hospital: data.hospital,
        hospitalAddress: data.hospitalAddress,
        department: data.department,
        date: data.date,
        time: data.time,
        referenceNumber: data.referenceNumber,
        preparationInstructions: data.preparationInstructions,
      })

    case 'cancellation':
      return emailTemplates.cancellation({
        patientName: data.patientName,
        hospital: data.hospital,
        department: data.department,
        date: data.date,
        time: data.time,
      })

    case 'feedback_request':
      return emailTemplates.feedbackRequest({
        patientName: data.patientName,
        hospital: data.hospital,
        department: data.department,
        date: data.date,
        appointmentId: data.appointmentId,
      })

    default:
      return null
  }
}

interface NotificationLog {
  appointment_id: string
  type: string
  status: string
  recipient: string
  message: string
  scheduled_for: string
  sent_at: string | null
  error_message?: string
}

async function logNotification(
  type: NotificationType,
  data: AppointmentData,
  result: NotificationResult
): Promise<void> {
  try {
    const supabase = await createClient()

    // Log SMS notification
    if (result.sms) {
      const smsLog: NotificationLog = {
        appointment_id: data.appointmentId,
        type: 'sms',
        status: result.sms.success ? 'sent' : 'failed',
        recipient: data.patientPhone,
        message: getSmsMessage(type, data) || '',
        scheduled_for: new Date().toISOString(),
        sent_at: result.sms.success ? new Date().toISOString() : null,
        error_message: result.sms.error,
      }
      await (supabase.from('notifications') as any).insert(smsLog)
    }

    // Log Email notification
    if (result.email) {
      const emailTemplate = getEmailTemplate(type, data)
      const emailLog: NotificationLog = {
        appointment_id: data.appointmentId,
        type: 'email',
        status: result.email.success ? 'sent' : 'failed',
        recipient: data.patientEmail || '',
        message: emailTemplate?.subject || '',
        scheduled_for: new Date().toISOString(),
        sent_at: result.email.success ? new Date().toISOString() : null,
        error_message: result.email.error,
      }
      await (supabase.from('notifications') as any).insert(emailLog)
    }
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

export { sendSMS, smsTemplates } from './sms'
export { sendEmail, emailTemplates } from './email'
