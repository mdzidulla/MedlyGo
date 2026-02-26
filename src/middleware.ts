import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = (req.auth?.user as any)?.role || 'patient'
  const pathname = nextUrl.pathname

  // Protected routes
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/provider') ||
    pathname.startsWith('/admin')

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isProtected && isLoggedIn) {
    // Role-based redirects
    if (pathname.startsWith('/provider') && role !== 'provider' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const redirect = role === 'provider' ? '/provider' : '/dashboard'
      return NextResponse.redirect(new URL(redirect, nextUrl))
    }
    if (pathname.startsWith('/dashboard')) {
      if (role === 'provider') return NextResponse.redirect(new URL('/provider', nextUrl))
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', nextUrl))
    }
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    const redirect = role === 'admin' ? '/admin' : role === 'provider' ? '/provider' : '/dashboard'
    return NextResponse.redirect(new URL(redirect, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
