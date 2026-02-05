'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const tErrors = useTranslations('errors')

  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError(tErrors('required'))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(tErrors('invalidEmail'))
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError(tErrors('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="shadow-card-hover">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-h1 text-gray-900 mb-2">{t('emailSent')}</h1>
          <p className="text-body text-gray-600 mb-6">
            {t('checkInbox')}
          </p>
          <p className="text-body-sm text-gray-500 mb-6">
            {t('checkSpam')}
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-11 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-all"
          >
            {t('backToLogin')}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card-hover">
      <CardHeader className="text-center">
        <CardTitle className="text-h1">{t('title')}</CardTitle>
        <CardDescription className="text-body">
          {t('subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-body-sm">
              {error}
            </div>
          )}

          <Input
            label={t('emailLabel')}
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            {t('submitButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-gray-600">
          {t('rememberPassword')}{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
