'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
interface HospitalData {
  name: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website?: string
  type: 'public' | 'private'
  description?: string
  departments: string[] // Array of department IDs to associate
}

interface CreateHospitalResult {
  success: boolean
  error?: string
  hospitalId?: string
  credentials?: {
    email: string
    temporaryPassword: string
  }
}

interface UpdateHospitalResult {
  success: boolean
  error?: string
}

interface DeleteHospitalResult {
  success: boolean
  error?: string
}

// Helper: Generate temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper: Verify admin role
async function verifyAdmin(supabase: any): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isAdmin: false, error: 'Not authenticated' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (userData?.role !== 'admin') {
    return { isAdmin: false, error: 'Unauthorized - Admin access required' }
  }

  return { isAdmin: true, userId: user.id }
}

/**
 * Create a new hospital with provider account
 */
export async function createHospital(data: HospitalData): Promise<CreateHospitalResult> {
  try {
    const supabase = await createClient()

    const adminCheck = await verifyAdmin(supabase)
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    // Generate temporary password for the hospital's admin account
    const temporaryPassword = generateTemporaryPassword()

    // Create auth user for hospital
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: temporaryPassword,
      options: {
        data: {
          full_name: data.name,
          role: 'provider',
        },
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return { success: false, error: authError?.message || 'Failed to create hospital account' }
    }

    const client: any = supabase

    // Create user record
    const { error: userError } = await client
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.name,
        phone: data.phone,
        role: 'provider',
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      return { success: false, error: 'Failed to create user record' }
    }

    // Create hospital record
    const { data: hospitalData, error: hospitalError } = await client
      .from('hospitals')
      .insert({
        name: data.name,
        address: data.address,
        city: data.city,
        region: data.region,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        type: data.type,
        description: data.description || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (hospitalError || !hospitalData) {
      console.error('Error creating hospital record:', hospitalError)
      return { success: false, error: 'Failed to create hospital record' }
    }

    // Create provider record linking user to hospital
    const { error: providerError } = await client
      .from('providers')
      .insert({
        user_id: authData.user.id,
        hospital_id: hospitalData.id,
        is_active: true,
      })

    if (providerError) {
      console.error('Error creating provider record:', providerError)
      return { success: false, error: 'Failed to link hospital account' }
    }

    // Associate departments with hospital (if any selected)
    if (data.departments && data.departments.length > 0) {
      const { error: deptError } = await client
        .from('departments')
        .update({ hospital_id: hospitalData.id })
        .in('id', data.departments)

      if (deptError) {
        console.error('Error associating departments:', deptError)
        // Don't fail the whole operation for this
      }
    }

    revalidatePath('/admin/hospitals')

    return {
      success: true,
      hospitalId: hospitalData.id,
      credentials: {
        email: data.email,
        temporaryPassword,
      },
    }
  } catch (error) {
    console.error('Unexpected error creating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing hospital
 */
export async function updateHospital(
  hospitalId: string,
  data: Partial<HospitalData>
): Promise<UpdateHospitalResult> {
  try {
    const supabase = await createClient()

    const adminCheck = await verifyAdmin(supabase)
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    const client: any = supabase

    // Update hospital record
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.address) updateData.address = data.address
    if (data.city) updateData.city = data.city
    if (data.region) updateData.region = data.region
    if (data.phone) updateData.phone = data.phone
    if (data.email) updateData.email = data.email
    if (data.website !== undefined) updateData.website = data.website
    if (data.type) updateData.type = data.type
    if (data.description !== undefined) updateData.description = data.description

    const { error } = await client
      .from('hospitals')
      .update(updateData)
      .eq('id', hospitalId)

    if (error) {
      console.error('Error updating hospital:', error)
      return { success: false, error: 'Failed to update hospital' }
    }

    revalidatePath('/admin/hospitals')
    revalidatePath(`/admin/hospitals/${hospitalId}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete (deactivate) a hospital
 */
export async function deleteHospital(hospitalId: string): Promise<DeleteHospitalResult> {
  try {
    const supabase = await createClient()

    const adminCheck = await verifyAdmin(supabase)
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    const client: any = supabase

    // Soft delete - set is_active to false
    const { error } = await client
      .from('hospitals')
      .update({ is_active: false })
      .eq('id', hospitalId)

    if (error) {
      console.error('Error deactivating hospital:', error)
      return { success: false, error: 'Failed to deactivate hospital' }
    }

    // Also deactivate associated providers
    await client
      .from('providers')
      .update({ is_active: false })
      .eq('hospital_id', hospitalId)

    revalidatePath('/admin/hospitals')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reactivate a hospital
 */
export async function reactivateHospital(hospitalId: string): Promise<UpdateHospitalResult> {
  try {
    const supabase = await createClient()

    const adminCheck = await verifyAdmin(supabase)
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    const client: any = supabase

    const { error } = await client
      .from('hospitals')
      .update({ is_active: true })
      .eq('id', hospitalId)

    if (error) {
      console.error('Error reactivating hospital:', error)
      return { success: false, error: 'Failed to reactivate hospital' }
    }

    revalidatePath('/admin/hospitals')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error reactivating hospital:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all available department types (for checkbox selection)
 */
export async function getDepartmentTypes() {
  try {
    const supabase = await createClient()

    // Get distinct department names/types
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching department types:', error)
      return { success: false, error: 'Failed to fetch departments' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    const supabase = await createClient()

    const adminCheck = await verifyAdmin(supabase)
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error }
    }

    const today = new Date().toISOString().split('T')[0]

    // Fetch all stats in parallel
    const [
      { count: totalPatients },
      { count: totalHospitals },
      { count: activeHospitals },
      { count: totalAppointments },
      { count: todayAppointments },
      { count: pendingAppointments },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('hospitals').select('*', { count: 'exact', head: true }),
      supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    return {
      success: true,
      data: {
        totalPatients: totalPatients || 0,
        totalHospitals: totalHospitals || 0,
        activeHospitals: activeHospitals || 0,
        totalAppointments: totalAppointments || 0,
        todayAppointments: todayAppointments || 0,
        pendingAppointments: pendingAppointments || 0,
      },
    }
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
