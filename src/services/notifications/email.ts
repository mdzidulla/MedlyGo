/**
 * Email Notification Service using Resend
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured')
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'MedlyGo <notifications@medlygo.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Email template helper
function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedlyGo</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #0F172A;
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-card {
      background-color: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1E6091 0%, #184D74 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .content {
      padding: 32px;
    }
    h1 {
      color: #0F172A;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    h2 {
      color: #334155;
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
    }
    p {
      color: #334155;
      margin: 0 0 16px 0;
    }
    .appointment-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .appointment-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #E2E8F0;
    }
    .appointment-row:last-child {
      border-bottom: none;
    }
    .appointment-label {
      color: #64748B;
      width: 120px;
      flex-shrink: 0;
    }
    .appointment-value {
      color: #0F172A;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      background-color: #1E6091;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 500;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #184D74;
    }
    .button-secondary {
      background-color: #FFFFFF;
      color: #1E6091 !important;
      border: 2px solid #1E6091;
    }
    .footer {
      padding: 24px 32px;
      background-color: #F8FAFC;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer p {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }
    .footer a {
      color: #1E6091;
      text-decoration: none;
    }
    .success-badge {
      display: inline-block;
      background-color: #DCFCE7;
      color: #166534;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .warning-badge {
      display: inline-block;
      background-color: #FEF3C7;
      color: #92400E;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .info-box {
      background-color: #EFF6FF;
      border-left: 4px solid #1E6091;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .info-box p {
      color: #1E40AF;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h1 class="logo">MedlyGo</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Need help? <a href="https://medlygo.com/support">Contact Support</a></p>
        <p style="margin-top: 12px;">© ${new Date().getFullYear()} MedlyGo. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

// Email Templates
export const emailTemplates = {
  bookingConfirmation: (data: {
    patientName: string
    hospital: string
    hospitalAddress: string
    department: string
    date: string
    time: string
    referenceNumber: string
  }) => ({
    subject: `Appointment Confirmed - ${data.hospital}`,
    html: baseEmailTemplate(`
      <span class="success-badge">✓ Booking Confirmed</span>
      <h1>Your appointment is confirmed!</h1>
      <p>Hi ${data.patientName},</p>
      <p>Your appointment has been successfully booked. Here are the details:</p>

      <div class="appointment-card">
        <div class="appointment-row">
          <span class="appointment-label">Hospital</span>
          <span class="appointment-value">${data.hospital}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Address</span>
          <span class="appointment-value">${data.hospitalAddress}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Department</span>
          <span class="appointment-value">${data.department}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Date</span>
          <span class="appointment-value">${data.date}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Time</span>
          <span class="appointment-value">${data.time}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Reference</span>
          <span class="appointment-value">${data.referenceNumber}</span>
        </div>
      </div>

      <div class="info-box">
        <p><strong>Remember:</strong> Please arrive 15 minutes before your appointment time. Bring your Ghana Card and any relevant medical documents.</p>
      </div>

      <a href="https://medlygo.com/dashboard" class="button">View Appointment</a>
      <a href="https://medlygo.com/appointments/${data.referenceNumber}/reschedule" class="button button-secondary" style="margin-left: 12px;">Reschedule</a>
    `),
    text: `
Appointment Confirmed!

Hi ${data.patientName},

Your appointment has been successfully booked.

Hospital: ${data.hospital}
Address: ${data.hospitalAddress}
Department: ${data.department}
Date: ${data.date}
Time: ${data.time}
Reference: ${data.referenceNumber}

Please arrive 15 minutes before your appointment time. Bring your Ghana Card and any relevant medical documents.

View your appointment: https://medlygo.com/dashboard

- MedlyGo Team
    `.trim(),
  }),

  reminder24Hours: (data: {
    patientName: string
    hospital: string
    hospitalAddress: string
    department: string
    date: string
    time: string
    referenceNumber: string
    preparationInstructions?: string
  }) => ({
    subject: `Reminder: Your appointment is tomorrow - ${data.hospital}`,
    html: baseEmailTemplate(`
      <span class="warning-badge">⏰ Appointment Tomorrow</span>
      <h1>Your appointment is tomorrow!</h1>
      <p>Hi ${data.patientName},</p>
      <p>This is a friendly reminder that you have an appointment scheduled for tomorrow.</p>

      <div class="appointment-card">
        <div class="appointment-row">
          <span class="appointment-label">Hospital</span>
          <span class="appointment-value">${data.hospital}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Address</span>
          <span class="appointment-value">${data.hospitalAddress}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Department</span>
          <span class="appointment-value">${data.department}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Date</span>
          <span class="appointment-value">${data.date}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Time</span>
          <span class="appointment-value">${data.time}</span>
        </div>
      </div>

      ${data.preparationInstructions ? `
      <h2>Preparation Instructions</h2>
      <p>${data.preparationInstructions}</p>
      ` : ''}

      <div class="info-box">
        <p><strong>What to bring:</strong> Ghana Card (or valid ID), health insurance card (if applicable), any previous medical records related to your visit.</p>
      </div>

      <a href="https://medlygo.com/dashboard" class="button">View Appointment</a>
    `),
    text: `
Reminder: Your appointment is tomorrow!

Hi ${data.patientName},

Hospital: ${data.hospital}
Address: ${data.hospitalAddress}
Department: ${data.department}
Date: ${data.date}
Time: ${data.time}

${data.preparationInstructions ? `Preparation Instructions: ${data.preparationInstructions}` : ''}

What to bring: Ghana Card (or valid ID), health insurance card (if applicable), any previous medical records.

- MedlyGo Team
    `.trim(),
  }),

  feedbackRequest: (data: {
    patientName: string
    hospital: string
    department: string
    date: string
    appointmentId: string
  }) => ({
    subject: `How was your visit to ${data.hospital}?`,
    html: baseEmailTemplate(`
      <h1>How was your appointment?</h1>
      <p>Hi ${data.patientName},</p>
      <p>We hope your visit to ${data.hospital} on ${data.date} went well. We'd love to hear about your experience!</p>
      <p>Your feedback helps us improve healthcare services for everyone in Ghana.</p>

      <a href="https://medlygo.com/feedback/${data.appointmentId}" class="button">Share Your Feedback</a>

      <p style="color: #64748B; font-size: 14px; margin-top: 24px;">This only takes 1-2 minutes and helps other patients make informed decisions.</p>
    `),
    text: `
How was your appointment?

Hi ${data.patientName},

We hope your visit to ${data.hospital} on ${data.date} went well.

Share your feedback: https://medlygo.com/feedback/${data.appointmentId}

Your feedback helps us improve healthcare services for everyone.

- MedlyGo Team
    `.trim(),
  }),

  cancellation: (data: {
    patientName: string
    hospital: string
    department: string
    date: string
    time: string
    reason?: string
  }) => ({
    subject: `Appointment Cancelled - ${data.hospital}`,
    html: baseEmailTemplate(`
      <h1>Appointment Cancelled</h1>
      <p>Hi ${data.patientName},</p>
      <p>Your appointment has been cancelled as requested.</p>

      <div class="appointment-card">
        <div class="appointment-row">
          <span class="appointment-label">Hospital</span>
          <span class="appointment-value">${data.hospital}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Department</span>
          <span class="appointment-value">${data.department}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Date</span>
          <span class="appointment-value">${data.date}</span>
        </div>
        <div class="appointment-row">
          <span class="appointment-label">Time</span>
          <span class="appointment-value">${data.time}</span>
        </div>
        ${data.reason ? `
        <div class="appointment-row">
          <span class="appointment-label">Reason</span>
          <span class="appointment-value">${data.reason}</span>
        </div>
        ` : ''}
      </div>

      <p>Need to book a new appointment?</p>
      <a href="https://medlygo.com/book" class="button">Book New Appointment</a>
    `),
    text: `
Appointment Cancelled

Hi ${data.patientName},

Your appointment has been cancelled.

Hospital: ${data.hospital}
Department: ${data.department}
Date: ${data.date}
Time: ${data.time}
${data.reason ? `Reason: ${data.reason}` : ''}

Book a new appointment: https://medlygo.com/book

- MedlyGo Team
    `.trim(),
  }),
}
