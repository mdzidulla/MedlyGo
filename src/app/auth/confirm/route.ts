import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // For signup confirmations, redirect to onboarding
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/dashboard/onboarding`)
      }
      // For password recovery
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      // Default redirect
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Email verification error:', error)
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
