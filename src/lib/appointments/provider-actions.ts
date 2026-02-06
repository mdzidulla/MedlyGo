'use server'

import { createClient } from '@/lib/supabase/server'
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
 * Approve a pending appointment
 */
export async function approveAppointment(
  appointmentId: string
): Promise<ApproveAppointmentResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get hospital ID - check providers table first, then hospital email
    let hospitalId: string | null = null
    const client: any = supabase

    const { data: providerData } = await client
      .from('providers')
      .select('id, hospital_id')
      .eq('user_id', user.id)
      .single()

    if (providerData) {
      hospitalId = providerData.hospital_id
    } else {
      // Check if user email matches a hospital email
      const { data: hospitalByEmail } = await client
        .from('hospitals')
        .select('id')
        .eq('email', user.email)
        .single()

      if (hospitalByEmail) {
        hospitalId = hospitalByEmail.id
      }
    }

    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const { data: appointment } = await client
      .from('appointments')
      .select('id, hospital_id, status')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospital_id !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to confirmed
    const { error } = await client
      .from('appointments')
      .update({
        status: 'confirmed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (error) {
      console.error('Error approving appointment:', error)
      return { success: false, error: 'Failed to approve appointment' }
    }

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
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get hospital ID - check providers table first, then hospital email
    let hospitalId: string | null = null
    const client: any = supabase

    const { data: providerData } = await client
      .from('providers')
      .select('id, hospital_id')
      .eq('user_id', user.id)
      .single()

    if (providerData) {
      hospitalId = providerData.hospital_id
    } else {
      // Check if user email matches a hospital email
      const { data: hospitalByEmail } = await client
        .from('hospitals')
        .select('id')
        .eq('email', user.email)
        .single()

      if (hospitalByEmail) {
        hospitalId = hospitalByEmail.id
      }
    }

    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const { data: appointment } = await client
      .from('appointments')
      .select('id, hospital_id, status')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospital_id !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to rejected
    const { error } = await client
      .from('appointments')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (error) {
      console.error('Error rejecting appointment:', error)
      return { success: false, error: 'Failed to reject appointment' }
    }

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
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get hospital ID - check providers table first, then hospital email
    let hospitalId: string | null = null
    const client: any = supabase

    const { data: providerData } = await client
      .from('providers')
      .select('id, hospital_id')
      .eq('user_id', user.id)
      .single()

    if (providerData) {
      hospitalId = providerData.hospital_id
    } else {
      // Check if user email matches a hospital email
      const { data: hospitalByEmail } = await client
        .from('hospitals')
        .select('id')
        .eq('email', user.email)
        .single()

      if (hospitalByEmail) {
        hospitalId = hospitalByEmail.id
      }
    }

    if (!hospitalId) {
      return { success: false, error: 'Provider not found' }
    }

    // Verify the appointment belongs to the provider's hospital and is pending
    const { data: appointment } = await client
      .from('appointments')
      .select('id, hospital_id, status')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.hospital_id !== hospitalId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (appointment.status !== 'pending') {
      return { success: false, error: 'Appointment is not pending' }
    }

    // Update appointment status to suggested
    const { error } = await client
      .from('appointments')
      .update({
        status: 'suggested',
        suggested_date: suggestedDate,
        suggested_time: suggestedTime,
        rejection_reason: reason || 'We have suggested an alternative time slot.',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (error) {
      console.error('Error suggesting alternative:', error)
      return { success: false, error: 'Failed to suggest alternative' }
    }

    revalidatePath('/provider/appointments')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error suggesting alternative:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
