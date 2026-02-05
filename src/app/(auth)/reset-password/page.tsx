'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useTranslations('auth.resetPassword')
  const tErrors = useTranslations('errors')
  const tCommon = useTranslations('common')

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError(tErrors('fillAllFields'))
      return
    }

    if (password !== confirmPassword) {
      setError(tErrors('passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(tErrors('passwordMinLength'))
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(tErrors('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
              <span className="text-h3 font-bold text-primary">{tCommon('appName')}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-8 px-4">
          <Card className="w-full max-w-md">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="text-h1 text-gray-900 mb-2">{t('success')}</h1>
              <p className="text-body text-gray-600 mb-6">
                {t('successMessage')}
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-11 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-all"
              >
                {t('goToLogin')}
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

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
            <span className="text-h3 font-bold text-primary">{tCommon('appName')}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-h1 text-gray-900 mb-2">{t('title')}</h1>
              <p className="text-body text-gray-600">
                {t('subtitle')}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 text-error text-body-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('passwordLabel')}
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label={t('confirmLabel')}
                type="password"
                placeholder={t('confirmPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          password.length >= level * 2
                            ? password.length >= 8
                              ? 'bg-success'
                              : 'bg-warning'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-body-sm text-gray-500">
                    {password.length < 8
                      ? `${8 - password.length} ${t('moreChars')}`
                      : `✓ ${t('strongPassword')}`}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('updating')}
                  </>
                ) : (
                  t('submitButton')
                )}
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
      </main>
    </div>
  )
}
