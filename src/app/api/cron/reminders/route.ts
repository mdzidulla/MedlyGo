import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAppointmentNotification, NotificationType } from '@/services/notifications'

// Vercel Cron Job - runs every hour
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max execution time

interface AppointmentWithDetails {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  patient: {
    id: string
    user: {
      full_name: string
      phone: string
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
  reference_number: string
  preparation_instructions: string | null
}

// Type for raw Supabase query result
interface RawAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reference_number: string
  preparation_instructions: string | null
  patient: {
    id: string
    user: {
      full_name: string
      phone: string
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
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date()

    // Calculate time windows for each reminder type
    const windows = {
      reminder_48h: {
        start: new Date(now.getTime() + 47 * 60 * 60 * 1000), // 47 hours from now
        end: new Date(now.getTime() + 49 * 60 * 60 * 1000),   // 49 hours from now
      },
      reminder_24h: {
        start: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours from now
        end: new Date(now.getTime() + 25 * 60 * 60 * 1000),   // 25 hours from now
      },
      reminder_2h: {
        start: new Date(now.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
        end: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),   // 2.5 hours from now
      },
    }

    const results = {
      reminder_48h: { sent: 0, failed: 0 },
      reminder_24h: { sent: 0, failed: 0 },
      reminder_2h: { sent: 0, failed: 0 },
    }

    // Process each reminder type
    for (const [reminderType, window] of Object.entries(windows)) {
      const appointments = await getAppointmentsInWindow(supabase, window.start, window.end, reminderType)

      for (const appointment of appointments) {
        try {
          const result = await sendAppointmentNotification(
            reminderType as NotificationType,
            {
              patientName: appointment.patient.user.full_name,
              patientPhone: appointment.patient.user.phone,
              patientEmail: appointment.patient.user.email || undefined,
              hospital: appointment.department.hospital.name,
              hospitalAddress: appointment.department.hospital.address,
              department: appointment.department.name,
              date: formatDate(appointment.appointment_date),
              time: formatTime(appointment.appointment_time),
              referenceNumber: appointment.reference_number,
              appointmentId: appointment.id,
              preparationInstructions: appointment.preparation_instructions || undefined,
            },
            {
              sendSms: true,
              sendEmail: reminderType === 'reminder_24h', // Only send email for 24h reminder
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  windowStart: Date,
  windowEnd: Date,
  reminderType: string
): Promise<AppointmentWithDetails[]> {
  // Get appointments within the time window that haven't received this reminder yet
  const startDate = windowStart.toISOString().split('T')[0]
  const endDate = windowEnd.toISOString().split('T')[0]

  // Query appointments with patient and department details
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      reference_number,
      preparation_instructions,
      patient:patients!inner(
        id,
        user:users!inner(
          full_name,
          phone,
          email
        )
      ),
      department:departments!inner(
        name,
        hospital:hospitals!inner(
          name,
          address
        )
      )
    `)
    .in('status', ['confirmed', 'scheduled'])
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)

  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }

  if (!data) return []

  // Cast to our expected type
  const appointments = data as unknown as RawAppointment[]

  // Filter appointments that fall within the time window
  const filteredAppointments = appointments.filter((apt) => {
    const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`)
    return appointmentDateTime >= windowStart && appointmentDateTime <= windowEnd
  })

  // Check which appointments haven't received this reminder yet
  const appointmentIds = filteredAppointments.map(a => a.id)

  if (appointmentIds.length === 0) return []

  const { data: sentReminders } = await supabase
    .from('notifications')
    .select('appointment_id')
    .in('appointment_id', appointmentIds)
    .eq('type', 'sms')
    .eq('status', 'sent')
    .like('message', `%${getReminderTypePattern(reminderType)}%`)

  const sentAppointmentIds = new Set(
    (sentReminders as { appointment_id: string }[] | null)?.map(r => r.appointment_id) || []
  )

  return filteredAppointments.filter(
    apt => !sentAppointmentIds.has(apt.id)
  ) as AppointmentWithDetails[]
}

function getReminderTypePattern(reminderType: string): string {
  switch (reminderType) {
    case 'reminder_48h':
      return '48 hours'
    case 'reminder_24h':
      return '24 hours'
    case 'reminder_2h':
      return '2 hours'
    default:
      return ''
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GH', {
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
