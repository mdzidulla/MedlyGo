'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export { signIn, signOut, useSession }

export async function signInWithCredentials(email: string, password: string) {
  return signIn('credentials', {
    email,
    password,
    redirect: false,
  })
}

export async function signInWithGoogle(callbackUrl?: string) {
  return signIn('google', {
    callbackUrl: callbackUrl || '/dashboard',
  })
}

export async function signUpWithCredentials(
  email: string,
  password: string,
  fullName: string
) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  })
  return res.json()
}
