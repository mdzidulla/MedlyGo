import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, UserRole } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Helper function to get user role
  const getUserRole = async (): Promise<UserRole> => {
    if (!user) return 'patient'

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: UserRole } | null }

    return userProfile?.role || 'patient'
  }

  // Protected routes - redirect to login if not authenticated
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/provider') || pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const role = await getUserRole()

    // Provider routes protection
    if (pathname.startsWith('/provider')) {
      if (role !== 'provider' && role !== 'admin') {
        // Patients cannot access provider routes
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        // Only admins can access admin routes
        const redirectPath = role === 'provider' ? '/provider' : '/dashboard'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    // Patient dashboard routes - skip onboarding check for providers and admins
    if (pathname.startsWith('/dashboard')) {
      // Providers and admins should be redirected to their portals
      if (role === 'provider') {
        return NextResponse.redirect(new URL('/provider', request.url))
      }
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Skip profile check for onboarding page itself
      if (!pathname.startsWith('/dashboard/onboarding')) {
        // Check if user profile is complete
        const { data: userProfile } = await supabase
          .from('users')
          .select('phone')
          .eq('id', user.id)
          .single() as { data: { phone: string | null } | null }

        const { data: patientProfile } = await supabase
          .from('patients')
          .select('date_of_birth, gender')
          .eq('user_id', user.id)
          .single() as { data: { date_of_birth: string | null; gender: string | null } | null }

        // Redirect to onboarding if profile is incomplete
        const isProfileIncomplete = !userProfile?.phone || !patientProfile?.date_of_birth || !patientProfile?.gender

        if (isProfileIncomplete) {
          return NextResponse.redirect(new URL('/dashboard/onboarding', request.url))
        }
      }
    }
  }

  // Redirect authenticated users away from login/signup pages based on role
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const role = await getUserRole()

    // Redirect to appropriate portal based on role
    const redirectPath = role === 'admin' ? '/admin' :
                        role === 'provider' ? '/provider' : '/dashboard'

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return response
}
