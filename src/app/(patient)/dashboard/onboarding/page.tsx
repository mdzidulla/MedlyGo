'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface OnboardingData {
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  region: string
  ghanaCardNumber: string
  nhisNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

const regions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti',
  'Western North',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState<OnboardingData>({
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    region: '',
    ghanaCardNumber: '',
    nhisNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  })

  const updateField = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (currentStep: number): boolean => {
    setError(null)

    switch (currentStep) {
      case 1:
        if (!formData.phone) {
          setError('Phone number is required')
          return false
        }
        if (!formData.dateOfBirth) {
          setError('Date of birth is required')
          return false
        }
        if (!formData.gender) {
          setError('Please select your gender')
          return false
        }
        return true
      case 2:
        if (!formData.region) {
          setError('Please select your region')
          return false
        }
        return true
      case 3:
        if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
          setError('Emergency contact name and phone are required')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Session expired. Please login again.')
        return
      }

      // First, ensure user exists in users table (upsert to handle both new and existing)
      const userData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || null,
        phone: formData.phone,
      }

      const { error: userError } = await (supabase
        .from('users') as ReturnType<typeof supabase.from>)
        .upsert(userData, {
          onConflict: 'id',
        })

      if (userError) throw userError

      // Create or update patient profile
      const patientData = {
        user_id: user.id,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        ghana_card_id: formData.ghanaCardNumber || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        emergency_contact_relationship: formData.emergencyContactRelationship || null,
      }

      const { error: patientError } = await (supabase
        .from('patients') as ReturnType<typeof supabase.from>)
        .upsert(patientData, {
          onConflict: 'user_id',
        })

      if (patientError) throw patientError

      // Redirect to dashboard using window.location for reliable navigation
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 max-w-2xl flex items-center justify-center">
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-xl">
          <CardContent className="p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-sm text-gray-500">Step {step} of 3</span>
                <button
                  onClick={handleSkip}
                  className="text-body-sm text-gray-500 hover:text-primary"
                >
                  Skip for now
                </button>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-h1 text-gray-900 mb-2">Complete Your Profile</h1>
                  <p className="text-body text-gray-600">
                    We need a few details to help you book appointments
                  </p>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <p className="text-body-sm text-gray-500 mt-1">
                    We&apos;ll send appointment confirmations and reminders to this number
                  </p>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Date of Birth <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Gender <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map((option) => (
                      <label key={option} className="flex-1">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={(e) => updateField('gender', e.target.value)}
                          className="sr-only peer"
                        />
                        <div className="p-3 text-center rounded-lg border border-gray-300 cursor-pointer peer-checked:border-primary peer-checked:bg-primary-50 peer-checked:text-primary transition-all">
                          {option}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address & ID */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-h1 text-gray-900 mb-2">Address & Identification</h1>
                  <p className="text-body text-gray-600">
                    This helps us find hospitals near you
                  </p>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Region <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select your region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">City/Town</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Accra, Kumasi"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Street address"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">Ghana Card Number</label>
                  <input
                    type="text"
                    value={formData.ghanaCardNumber}
                    onChange={(e) => updateField('ghanaCardNumber', e.target.value)}
                    placeholder="GHA-XXXXXXXXX-X"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">NHIS Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.nhisNumber}
                    onChange={(e) => updateField('nhisNumber', e.target.value)}
                    placeholder="If you have NHIS coverage"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-h1 text-gray-900 mb-2">Emergency Contact</h1>
                  <p className="text-body text-gray-600">
                    Someone we can contact in case of emergency
                  </p>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Contact Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                    placeholder="Full name"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">
                    Contact Phone <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">Relationship</label>
                  <select
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => updateField('emergencyContactRelationship', e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="p-4 bg-info/10 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-body-sm text-gray-600">
                      This information will only be used in medical emergencies and kept confidential.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-body-sm">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
