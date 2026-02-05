'use server'

import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    // Get current user
    const { data: authData, error: userError } = await supabase.auth.getUser()
    if (userError || !authData?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = authData.user.id

    // Get patient ID for this user
    const { data: patientRows, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (patientError || !patientRows || patientRows.length === 0) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = (patientRows[0] as { id: string }).id

    // Generate unique reference number
    let referenceNumber = generateReferenceNumber()

    // Check for uniqueness and regenerate if needed
    let attempts = 0
    while (attempts < 5) {
      const { data: existingRows } = await supabase
        .from('appointments')
        .select('id')
        .eq('reference_number', referenceNumber)
        .limit(1)

      if (!existingRows || existingRows.length === 0) break
      referenceNumber = generateReferenceNumber()
      attempts++
    }

    // Insert appointment with status 'pending' using type-casted client
    const client: any = supabase
    const { error: insertError } = await client
      .from('appointments')
      .insert({
        patient_id: patientId,
        hospital_id: data.hospital_id,
        department_id: data.department_id,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        status: 'pending',
        reference_number: referenceNumber,
        reason: data.reason || null,
      })

    if (insertError) {
      console.error('Error creating appointment:', insertError)
      return { success: false, error: insertError.message }
    }

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
    const supabase = await createClient()

    // Get current user
    const { data: authData, error: userError } = await supabase.auth.getUser()
    if (userError || !authData?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = authData.user.id

    // Get patient ID for this user
    const { data: patientRows } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!patientRows || patientRows.length === 0) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = (patientRows[0] as { id: string }).id

    // Update appointment to cancelled (only if it belongs to this patient)
    const client: any = supabase
    const { error: updateError } = await client
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by patient',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('patient_id', patientId)
      .in('status', ['pending', 'confirmed', 'suggested'])

    if (updateError) {
      console.error('Error cancelling appointment:', updateError)
      return { success: false, error: updateError.message }
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

export async function respondToSuggestion(
  appointmentId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: authData, error: userError } = await supabase.auth.getUser()
    if (userError || !authData?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = authData.user.id

    // Get patient ID for this user
    const { data: patientRows } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!patientRows || patientRows.length === 0) {
      return { success: false, error: 'Patient profile not found' }
    }

    const patientId = (patientRows[0] as { id: string }).id

    // Get the suggested appointment
    const { data: appointmentRows, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('patient_id', patientId)
      .eq('status', 'suggested')
      .limit(1)

    if (fetchError || !appointmentRows || appointmentRows.length === 0) {
      return { success: false, error: 'Suggested appointment not found' }
    }

    const appointment: any = appointmentRows[0]
    const client: any = supabase

    if (accept) {
      // Accept the suggestion - update status to confirmed
      const updateData: any = {
        status: 'confirmed',
      }

      if (appointment.suggested_date) {
        updateData.appointment_date = appointment.suggested_date
      }
      if (appointment.suggested_time) {
        updateData.start_time = appointment.suggested_time
      }

      const { error: updateError } = await client
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }
    } else {
      // Reject the suggestion - update status to cancelled
      const { error: updateError } = await client
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Patient rejected suggested alternative',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }
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
