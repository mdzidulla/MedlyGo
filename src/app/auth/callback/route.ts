import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  // Check for error params from Supabase
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  const supabase = await createClient()

  // Handle Supabase error redirects (e.g., expired or already used links)
  if (error_param) {
    console.error('Auth callback error:', error_param, error_description)

    // Check if user is already authenticated despite the error
    // This handles cases where the link was already used but user is confirmed
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      // User is already confirmed, redirect to appropriate page
      return NextResponse.redirect(`${origin}/dashboard/onboarding`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Handle OAuth callback (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth code exchange error:', error)

    // Check if user is authenticated despite the error
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      return NextResponse.redirect(`${origin}/dashboard/onboarding`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Handle email confirmation (token hash - used by magic links and email confirmations)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink',
    })

    if (!error) {
      // For signup confirmations, redirect to onboarding
      if (type === 'signup') {
        return NextResponse.redirect(`${origin}/dashboard/onboarding`)
      }
      // For password recovery, redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      // For email change confirmations
      if (type === 'email') {
        return NextResponse.redirect(`${origin}/dashboard/profile?email_confirmed=true`)
      }
      // Default redirect
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Token verification error:', error)

    // Check if user is already confirmed despite verification error
    // This handles cases like "Token has already been used"
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      if (type === 'signup') {
        return NextResponse.redirect(`${origin}/dashboard/onboarding`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // No code or token_hash provided - check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email_confirmed_at) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
