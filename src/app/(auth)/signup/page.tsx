'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Phone Verification' },
  { id: 2, title: 'Personal Info' },
  { id: 3, title: 'Create Password' },
  { id: 4, title: 'Ghana Card (Optional)' },
]

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // Form data
  const [phone, setPhone] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [otpSent, setOtpSent] = React.useState(false)
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [dateOfBirth, setDateOfBirth] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [ghanaCardId, setGhanaCardId] = React.useState('')

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+233${phone.replace(/^0/, '')}`,
      })

      if (error) {
        setError(error.message)
      } else {
        setOtpSent(true)
      }
    } catch (err) {
      setError('Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        phone: `+233${phone.replace(/^0/, '')}`,
        token: otp,
        type: 'sms',
      })

      if (error) {
        setError(error.message)
      } else {
        setCurrentStep(2)
      }
    } catch (err) {
      setError('Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = () => {
    setError('')

    if (currentStep === 2) {
      if (!fullName || !email) {
        setError('Please fill in all required fields')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!password || !confirmPassword) {
        setError('Please enter and confirm your password')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      setCurrentStep(4)
    }
  }

  const handleSignup = async () => {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Update user profile
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          ghana_card_id: ghanaCardId || null,
        },
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Failed to complete signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-card-hover">
      <CardHeader className="text-center">
        <CardTitle className="text-h1">Create Account</CardTitle>
        <CardDescription className="text-body">
          Join MedlyGo to book hospital appointments
        </CardDescription>

        {/* Progress Steps */}
        <div className="flex justify-between mt-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-medium',
                  currentStep >= step.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {currentStep > step.id ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-body-sm mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Phone Verification */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-20">
                <Input
                  value="+233"
                  disabled
                  className="text-center"
                />
              </div>
              <Input
                placeholder="Phone number (e.g., 244123456)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
            </div>

            {otpSent && (
              <Input
                label="Enter OTP"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            )}

            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Send OTP
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Verify OTP
                </Button>
                <Button
                  onClick={handleSendOtp}
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                >
                  Resend OTP
                </Button>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="bg-white px-4 text-gray-500">Or sign up with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleNextStep} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Input
              label="Create Password *"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Confirm Password *"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* Password strength indicator */}
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      password.length >= level * 2
                        ? password.length >= 8
                          ? 'bg-success'
                          : 'bg-warning'
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
              <p className="text-body-sm text-gray-500">
                {password.length < 8
                  ? 'Password must be at least 8 characters'
                  : 'Strong password'}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleNextStep} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Ghana Card (Optional) */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-4 bg-info/10 rounded-lg">
              <p className="text-body-sm text-info">
                Adding your Ghana Card ID helps verify your identity and speeds up the check-in process at hospitals.
              </p>
            </div>

            <Input
              label="Ghana Card ID (Optional)"
              placeholder="GHA-XXXXXXXXX-X"
              value={ghanaCardId}
              onChange={(e) => setGhanaCardId(e.target.value.toUpperCase())}
            />

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSignup}
                className="flex-1"
                isLoading={isLoading}
              >
                Complete Signup
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleSignup}
              className="w-full"
              disabled={isLoading}
            >
              Skip for now
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-body-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
