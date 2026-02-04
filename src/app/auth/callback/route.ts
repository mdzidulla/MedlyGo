import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // Handle OAuth callback (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth code exchange error:', error)
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
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // No code or token_hash provided
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
