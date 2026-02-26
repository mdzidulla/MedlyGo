import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAppointmentNotification, NotificationType } from '@/services/notifications'

// Cron Job - runs every hour
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface AppointmentWithDetails {
  id: string
  appointmentDate: Date
  startTime: string
  status: string
  referenceNumber: string
  patient: {
    id: string
    user: {
      fullName: string | null
      phone: string | null
      email: string | null
    }
  }
  department: {
    name: string
    hospital: {
      name: string
      address: string
    }
  }
}

export async function GET(request: Request) {
  // Verify the request is authorized
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const windows = {
      reminder_48h: {
        start: new Date(now.getTime() + 47 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 49 * 60 * 60 * 1000),
      },
      reminder_24h: {
        start: new Date(now.getTime() + 23 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      },
      reminder_2h: {
        start: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
      },
    }

    const results = {
      reminder_48h: { sent: 0, failed: 0 },
      reminder_24h: { sent: 0, failed: 0 },
      reminder_2h: { sent: 0, failed: 0 },
    }

    for (const [reminderType, window] of Object.entries(windows)) {
      const appointments = await getAppointmentsInWindow(window.start, window.end, reminderType)

      for (const appointment of appointments) {
        try {
          const result = await sendAppointmentNotification(
            reminderType as NotificationType,
            {
              patientName: appointment.patient.user.fullName || 'Patient',
              patientPhone: appointment.patient.user.phone || '',
              patientEmail: appointment.patient.user.email || undefined,
              hospital: appointment.department.hospital.name,
              hospitalAddress: appointment.department.hospital.address,
              department: appointment.department.name,
              date: formatDate(appointment.appointmentDate),
              time: formatTime(appointment.startTime),
              referenceNumber: appointment.referenceNumber,
              appointmentId: appointment.id,
            },
            {
              sendSms: true,
              sendEmail: reminderType === 'reminder_24h',
            }
          )

          if (result.sms?.success || result.email?.success) {
            results[reminderType as keyof typeof results].sent++
          } else {
            results[reminderType as keyof typeof results].failed++
          }
        } catch (error) {
          console.error(`Failed to send ${reminderType} for appointment ${appointment.id}:`, error)
          results[reminderType as keyof typeof results].failed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getAppointmentsInWindow(
  windowStart: Date,
  windowEnd: Date,
  reminderType: string
): Promise<AppointmentWithDetails[]> {
  const startDate = new Date(windowStart.toISOString().split('T')[0])
  const endDate = new Date(windowEnd.toISOString().split('T')[0])
  endDate.setDate(endDate.getDate() + 1) // Include the end date

  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ['confirmed', 'scheduled'] },
      appointmentDate: { gte: startDate, lt: endDate },
    },
    include: {
      patient: {
        include: {
          user: {
            select: { fullName: true, phone: true, email: true },
          },
        },
      },
      department: {
        include: {
          hospital: {
            select: { name: true, address: true },
          },
        },
      },
    },
  }) as unknown as AppointmentWithDetails[]

  // Filter by exact time window
  const filtered = appointments.filter((apt) => {
    const dateStr = apt.appointmentDate instanceof Date
      ? apt.appointmentDate.toISOString().split('T')[0]
      : String(apt.appointmentDate)
    const appointmentDateTime = new Date(`${dateStr}T${apt.startTime}`)
    return appointmentDateTime >= windowStart && appointmentDateTime <= windowEnd
  })

  if (filtered.length === 0) return []

  // Check which haven't received this reminder yet
  const appointmentIds = filtered.map((a) => a.id)
  const pattern = getReminderTypePattern(reminderType)

  const sentReminders = await prisma.notification.findMany({
    where: {
      appointmentId: { in: appointmentIds },
      type: 'sms',
      status: 'sent',
      message: { contains: pattern },
    },
    select: { appointmentId: true },
  })

  const sentIds = new Set(sentReminders.map((r) => r.appointmentId))
  return filtered.filter((apt) => !sentIds.has(apt.id))
}

function getReminderTypePattern(reminderType: string): string {
  switch (reminderType) {
    case 'reminder_48h': return '48 hours'
    case 'reminder_24h': return '24 hours'
    case 'reminder_2h': return '2 hours'
    default: return ''
  }
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-GH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}
