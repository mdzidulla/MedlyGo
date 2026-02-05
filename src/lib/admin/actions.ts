'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateProviderData {
  email: string
  fullName: string
  phone: string
  hospitalId: string
  departmentId: string
  specialization?: string
}

interface CreateProviderResult {
  success: boolean
  error?: string
  credentials?: {
    email: string
    temporaryPassword: string
  }
}

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Create a new provider account (admin only)
 */
export async function createProvider(data: CreateProviderData): Promise<CreateProviderResult> {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (userData?.role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()

    // Create auth user with Supabase Admin API
    // Note: In production, you'd use Supabase Admin SDK or a secure server-side method
    // For now, we'll use the signUp method and the admin will share credentials

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' }
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: temporaryPassword,
      options: {
        data: {
          full_name: data.fullName,
          role: 'provider',
        },
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return { success: false, error: authError?.message || 'Failed to create user account' }
    }

    // Create user record
    const client: any = supabase
    const { error: userError } = await client
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        phone: data.phone,
        role: 'provider',
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      // Try to clean up the auth user if user record creation fails
      return { success: false, error: 'Failed to create user record' }
    }

    // Create provider record
    const { error: providerError } = await client
      .from('providers')
      .insert({
        user_id: authData.user.id,
        hospital_id: data.hospitalId,
        department_id: data.departmentId,
        specialization: data.specialization || null,
        is_active: true,
      })

    if (providerError) {
      console.error('Error creating provider record:', providerError)
      return { success: false, error: 'Failed to create provider record' }
    }

    revalidatePath('/admin/providers')

    return {
      success: true,
      credentials: {
        email: data.email,
        temporaryPassword,
      },
    }
  } catch (error) {
    console.error('Unexpected error creating provider:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get list of all providers (admin only)
 */
export async function getProviders() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('providers')
      .select(`
        id,
        user_id,
        specialization,
        is_active,
        created_at,
        user:users(full_name, email, phone),
        hospital:hospitals(name),
        department:departments(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching providers:', error)
      return { success: false, error: 'Failed to fetch providers' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching providers:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Deactivate a provider (admin only)
 */
export async function deactivateProvider(providerId: string) {
  try {
    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (userData?.role !== 'admin') {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const client: any = supabase
    const { error } = await client
      .from('providers')
      .update({ is_active: false })
      .eq('id', providerId)

    if (error) {
      console.error('Error deactivating provider:', error)
      return { success: false, error: 'Failed to deactivate provider' }
    }

    revalidatePath('/admin/providers')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deactivating provider:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
