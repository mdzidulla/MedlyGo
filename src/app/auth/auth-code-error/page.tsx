'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 max-w-2xl flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo_medlygo.PNG"
                alt="MedlyGo Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-h3 font-bold text-primary">MedlyGo</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-h1 text-gray-900 mb-2">
              Authentication Error
            </h1>

            <p className="text-body text-gray-600 mb-6">
              We couldn&apos;t verify your email. This can happen if:
            </p>

            <ul className="text-left text-body-sm text-gray-600 mb-8 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>The confirmation link has expired</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>The link has already been used</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>The link was modified or incomplete</span>
              </li>
            </ul>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center w-full h-11 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-all"
              >
                Try Signing Up Again
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-11 px-6 py-2 border-2 border-primary text-primary bg-transparent rounded-lg font-medium hover:bg-primary-50 transition-all"
              >
                Go to Login
              </Link>
            </div>

            <p className="mt-6 text-body-sm text-gray-500">
              Need help?{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact Support
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
