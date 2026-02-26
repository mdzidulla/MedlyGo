'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface ApproveAppointmentResult {
  success: boolean
  error?: string
}

interface RejectAppointmentResult {
  success: boolean
  error?: string
}

interface SuggestAlternativeResult {
  success: boolean
  error?: string
}

/**
 * Get the hospital ID for the current user.
 * First checks the providers table, then falls back to matching the user's email
 * against a hospital email.
 */
async function getHospitalIdForUser(userId: string, userEmail: string | null | undefined): Promise<string | null> {
  // Check providers table first
  const provider = await prisma.provider.findUnique({
    where: { userId },
    select: { hospitalId: true },
  })

  if (provider) {
    return provider.hospitalId
  }

  // Fallback: check if user email matches a hospital email
  if (userEmail) {
    const hospital = await prisma.hospital.findFirst({
      where: { email: userEmail },
      select: { id: true },
    })

    if (hospital) {
      return hospital.id
    }
  }

  return null
}

/**
 * Approve a pending appointment
 */
export async function approveAppointment(
  appointmentId: string
): Promise<ApproveAppointmentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const hospitalId = await getHospitalIdForUser(session.user.id, session.user.email)
    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, hospitalId: true, status: true },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospitalId !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to confirmed
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'confirmed',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    revalidatePath('/provider/appointments')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error approving appointment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reject a pending appointment
 */
export async function rejectAppointment(
  appointmentId: string,
  rejectionReason: string
): Promise<RejectAppointmentResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const hospitalId = await getHospitalIdForUser(session.user.id, session.user.email)
    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, hospitalId: true, status: true },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospitalId !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to rejected
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'rejected',
        rejectionReason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    revalidatePath('/provider/appointments')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error rejecting appointment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Suggest an alternative date/time for a pending appointment
 */
export async function suggestAlternative(
  appointmentId: string,
  suggestedDate: string,
  suggestedTime: string,
  reason?: string
): Promise<SuggestAlternativeResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const hospitalId = await getHospitalIdForUser(session.user.id, session.user.email)
    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, hospitalId: true, status: true },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospitalId !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to suggested
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'suggested',
        suggestedDate: new Date(suggestedDate),
        suggestedTime,
        rejectionReason: reason || 'We have suggested an alternative time slot.',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    revalidatePath('/provider/appointments')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error suggesting alternative:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
