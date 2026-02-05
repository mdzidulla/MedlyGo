import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper: Generate temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// POST - Create a new hospital with provider account
export async function POST(request: Request) {
  try {
    // Get the current user from the session to verify admin
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const data = await request.json()
    const { name, address, city, region, phone, email, website, type, description, departments } = data

    // Validate required fields
    if (!name || !address || !city || !region || !phone || !email || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create admin client with service role key (doesn't affect current session)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Generate temporary password for the hospital's admin account
    const temporaryPassword = generateTemporaryPassword()

    // Create auth user for hospital using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true, // Skip email confirmation since admin is creating
      user_metadata: {
        full_name: name,
        role: 'provider',
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create hospital account' },
        { status: 500 }
      )
    }

    // Create user record
    const { error: userRecordError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: name,
        phone: phone,
        role: 'provider',
      })

    if (userRecordError) {
      console.error('Error creating user record:', userRecordError)
      // Clean up auth user if user record fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // Create hospital record
    const { data: hospitalData, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .insert({
        name,
        address,
        city,
        region,
        phone,
        email,
        website: website || null,
        type,
        description: description || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (hospitalError || !hospitalData) {
      console.error('Error creating hospital record:', hospitalError)
      // Clean up user records if hospital fails
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create hospital record' },
        { status: 500 }
      )
    }

    // Create provider record linking user to hospital
    const { error: providerError } = await supabaseAdmin
      .from('providers')
      .insert({
        user_id: authData.user.id,
        hospital_id: hospitalData.id,
        is_active: true,
      })

    if (providerError) {
      console.error('Error creating provider record:', providerError)
      // Don't fail completely, but log the error
    }

    // Create departments for this hospital (if any selected)
    if (departments && departments.length > 0) {
      const departmentInserts = departments.map((deptName: string) => ({
        hospital_id: hospitalData.id,
        name: deptName,
      }))

      const { error: deptError } = await supabaseAdmin
        .from('departments')
        .insert(departmentInserts)

      if (deptError) {
        console.error('Error creating departments:', deptError)
        // Don't fail the whole operation for this
      }
    }

    return NextResponse.json({
      success: true,
      hospitalId: hospitalData.id,
      credentials: {
        email: email,
        temporaryPassword,
      },
    })
  } catch (error) {
    console.error('Unexpected error creating hospital:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
