'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Generate a unique reference number in format: MG-YYYYMMDD-XXXX
function generateReferenceNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MG-${datePart}-${randomPart}`
}

export interface CreateAppointmentData {
  hospital_id: string
  department_id: string
  appointment_date: string
  start_time: string
  reason?: string
}

export interface CreateAppointmentResult {
  success: boolean
  reference_number?: string
  error?: string
}

export async function createAppointment(
  data: CreateAppointmentData
): Promise<CreateAppointmentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = session.user.id

    // Get patient ID for this user
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = patient.id

    // Generate unique reference number
    let referenceNumber = generateReferenceNumber()

    // Check for uniqueness and regenerate if needed
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.appointment.findUnique({
        where: { referenceNumber },
        select: { id: true },
      })

      if (!existing) break
      referenceNumber = generateReferenceNumber()
      attempts++
    }

    // Insert appointment with status 'pending'
    await prisma.appointment.create({
      data: {
        patientId,
        hospitalId: data.hospital_id,
        departmentId: data.department_id,
        appointmentDate: new Date(data.appointment_date),
        startTime: data.start_time,
        status: 'pending',
        referenceNumber,
        reason: data.reason || null,
      },
    })

    // Revalidate the appointments page
    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')

    return {
      success: true,
      reference_number: referenceNumber,
    }
  } catch (error) {
    console.error('Unexpected error creating appointment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = session.user.id

    // Get patient ID for this user
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = patient.id

    // Update appointment to cancelled (only if it belongs to this patient and is in a cancellable state)
    const result = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        patientId,
        status: { in: ['pending', 'confirmed', 'suggested'] },
      },
      data: {
        status: 'cancelled',
        cancellationReason: reason || 'Cancelled by patient',
        cancelledAt: new Date(),
      },
    })

    if (result.count === 0) {
      return { success: false, error: 'Appointment not found or cannot be cancelled' }
    }

    // Revalidate pages
    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error cancelling appointment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = session.user.id

    // Get patient ID for this user
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = patient.id

    // Verify the appointment belongs to this patient and is in a reschedulable state
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: { in: ['pending', 'confirmed', 'suggested'] },
      },
      select: { id: true, status: true },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found or cannot be rescheduled' }
    }

    // Update appointment with new date/time and set status back to pending (requires re-approval)
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: new Date(newDate),
        startTime: newTime,
        status: 'pending', // Requires hospital re-approval
      },
    })

    // Revalidate pages
    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')
    revalidatePath('/provider')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error rescheduling appointment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function respondToSuggestion(
  appointmentId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = session.user.id

    // Get patient ID for this user
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!patient) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = patient.id

    // Get the suggested appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
        status: 'suggested',
      },
    })

    if (!appointment) {
      return { success: false, error: 'Suggested appointment not found' }
    }

    if (accept) {
      // Accept the suggestion - update status to confirmed
      const updateData: {
        status: 'confirmed'
        appointmentDate?: Date
        startTime?: string
      } = {
        status: 'confirmed',
      }

      if (appointment.suggestedDate) {
        updateData.appointmentDate = appointment.suggestedDate
      }
      if (appointment.suggestedTime) {
        updateData.startTime = appointment.suggestedTime
      }

      await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
      })
    } else {
      // Reject the suggestion - update status to cancelled
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'cancelled',
          cancellationReason: 'Patient rejected suggested alternative',
          cancelledAt: new Date(),
        },
      })
    }

    // Revalidate pages
    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error responding to suggestion:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
