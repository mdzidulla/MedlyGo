'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createAppointment } from '@/lib/appointments/actions'

interface Hospital {
  id: string
  name: string
  address: string
  city: string
  region: string
  is_active: boolean
  image_url: string | null
}

interface Department {
  id: string
  name: string
  description: string | null
  hospital_id: string
  is_active: boolean
}

type BookingStep = 'hospital' | 'department' | 'datetime' | 'confirm'

export default function BookPage() {
  const router = useRouter()
  const t = useTranslations('booking')
  const tCommon = useTranslations('common')
  const tChat = useTranslations('chat')

  const [step, setStep] = React.useState<BookingStep>('hospital')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedHospital, setSelectedHospital] = React.useState<Hospital | null>(null)
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  // Data states
  const [hospitals, setHospitals] = React.useState<Hospital[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch hospitals on mount
  React.useEffect(() => {
    async function fetchHospitals() {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name, address, city, region, is_active, image_url')
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setHospitals(data)
      }
      setIsLoading(false)
    }
    fetchHospitals()
  }, [])

  // Fetch departments when hospital is selected
  React.useEffect(() => {
    async function fetchDepartments() {
      if (!selectedHospital) {
        setDepartments([])
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description, hospital_id, is_active')
        .eq('hospital_id', selectedHospital.id)
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setDepartments(data)
      }
    }
    fetchDepartments()
  }, [selectedHospital])

  // Filter hospitals based on search
  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter departments based on search
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setStep('department')
    setSearchQuery('')
  }

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setStep('datetime')
  }

  const handleBack = () => {
    if (step === 'department') {
      setStep('hospital')
      setSelectedHospital(null)
    } else if (step === 'datetime') {
      setStep('department')
      setSelectedDepartment(null)
    } else if (step === 'confirm') {
      setStep('datetime')
    }
  }

  const stepLabels = [
    t('steps.hospital'),
    t('steps.department'),
    t('steps.datetime'),
    t('steps.confirm')
  ]

  // Department icons mapping
  const getDepartmentIcon = (name: string): string => {
    const iconMap: Record<string, string> = {
      'General Medicine': '🩺',
      'Pediatrics': '👶',
      'Obstetrics': '🤰',
      'Gynecology': '🤰',
      'Cardiology': '❤️',
      'Orthopedics': '🦴',
      'Dermatology': '🧴',
      'ENT': '👂',
      'Ophthalmology': '👁️',
      'Dental': '🦷',
      'Neurology': '🧠',
      'Surgery': '🔪',
      'Radiology': '📷',
      'Laboratory': '🧪',
      'Pharmacy': '💊',
      'Emergency': '🚑',
    }

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return icon
      }
    }
    return '🏥'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, index) => {
            const stepIndex = index + 1
            const steps: BookingStep[] = ['hospital', 'department', 'datetime', 'confirm']
            const currentStepIndex = steps.indexOf(step) + 1

            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-label font-medium',
                      currentStepIndex >= stepIndex
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {currentStepIndex > stepIndex ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      stepIndex
                    )}
                  </div>
                  <span className="mt-2 text-body-sm text-gray-600 hidden sm:block">{label}</span>
                </div>
                {index < 3 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      currentStepIndex > stepIndex ? 'bg-primary' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 'hospital' && (
        <div>
          <h1 className="text-h1 text-gray-900 mb-2">{t('hospital.title')}</h1>
          <p className="text-body text-gray-600 mb-6">
            {t('hospital.searchPlaceholder')}
          </p>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder={t('hospital.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {tChat('suggestions.findHospitals').split(' ').slice(-2).join(' ')}
            </Button>
          </div>

          {/* Hospital List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredHospitals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">{t('hospital.noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHospitals.map((hospital) => (
                <Card
                  key={hospital.id}
                  className="cursor-pointer hover:shadow-card-hover transition-shadow"
                  onClick={() => handleSelectHospital(hospital)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-h3 text-gray-900">{hospital.name}</h3>
                          <p className="text-body-sm text-gray-500">{hospital.address}</p>
                          <p className="text-body-sm text-gray-400">{hospital.city}, {hospital.region}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'department' && (
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tCommon('back')}
          </button>

          <h1 className="text-h1 text-gray-900 mb-2">{t('department.title')}</h1>
          <p className="text-body text-gray-600 mb-6">
            {selectedHospital?.name}
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Input
              placeholder={tCommon('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Department Grid */}
          {filteredDepartments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">{t('hospital.noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((dept) => (
                <Card
                  key={dept.id}
                  className="cursor-pointer hover:shadow-card-hover transition-shadow"
                  onClick={() => handleSelectDepartment(dept)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDepartmentIcon(dept.name)}</span>
                      <div>
                        <h3 className="text-label text-gray-900">{dept.name}</h3>
                        {dept.description && (
                          <p className="text-body-sm text-gray-500 line-clamp-1">{dept.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'datetime' && (
        <DateTimeSelection
          hospital={selectedHospital}
          department={selectedDepartment}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onBack={handleBack}
          onContinue={() => setStep('confirm')}
        />
      )}

      {step === 'confirm' && (
        <ConfirmBooking
          hospital={selectedHospital}
          department={selectedDepartment}
          date={selectedDate}
          time={selectedTime}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

// Date & Time Selection Component
function DateTimeSelection({
  hospital,
  department,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onBack,
  onContinue,
}: {
  hospital: Hospital | null
  department: Department | null
  selectedDate: Date | null
  selectedTime: string | null
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const t = useTranslations('booking')
  const tCommon = useTranslations('common')
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Time slots
  const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00']
  const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00']

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {tCommon('back')}
      </button>

      <h1 className="text-h1 text-gray-900 mb-2">{t('datetime.title')}</h1>
      <p className="text-body text-gray-600 mb-6">
        {hospital?.name} • {department?.name}
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-body-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />
                }

                const isPast = day < today
                const isSelected = selectedDate?.toDateString() === day.toDateString()
                const isToday = day.toDateString() === today.toDateString()

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && onDateChange(day)}
                    disabled={isPast}
                    className={cn(
                      'p-2 rounded-lg text-body-sm transition-colors',
                      isPast && 'text-gray-300 cursor-not-allowed',
                      !isPast && !isSelected && 'hover:bg-gray-100',
                      isSelected && 'bg-primary text-white',
                      isToday && !isSelected && 'border border-primary'
                    )}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-h3 text-gray-900 mb-4">{t('datetime.selectTime')}</h2>

            {!selectedDate ? (
              <p className="text-body text-gray-500">{t('datetime.selectDate')}</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-label text-gray-700 mb-3">{t('datetime.morning')}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {morningSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => onTimeChange(time)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-body-sm border transition-colors',
                          selectedTime === time
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 hover:border-primary hover:bg-primary-50'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-label text-gray-700 mb-3">{t('datetime.afternoon')}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {afternoonSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => onTimeChange(time)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-body-sm border transition-colors',
                          selectedTime === time
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 hover:border-primary hover:bg-primary-50'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          disabled={!selectedDate || !selectedTime}
          onClick={onContinue}
        >
          {tCommon('next')}
        </Button>
      </div>
    </div>
  )
}

// Confirm Booking Component
function ConfirmBooking({
  hospital,
  department,
  date,
  time,
  onBack,
}: {
  hospital: Hospital | null
  department: Department | null
  date: Date | null
  time: string | null
  onBack: () => void
}) {
  const router = useRouter()
  const t = useTranslations('booking')
  const tCommon = useTranslations('common')
  const tFooter = useTranslations('footer')
  const tNotifications = useTranslations('notifications')

  const [reason, setReason] = React.useState('')
  const [smsNotification, setSmsNotification] = React.useState(true)
  const [emailNotification, setEmailNotification] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState<{ referenceNumber: string } | null>(null)

  const handleConfirm = async () => {
    if (!termsAccepted || !hospital || !department || !date || !time) return

    setIsLoading(true)
    setError('')

    try {
      // Format date as YYYY-MM-DD
      const appointmentDate = date.toISOString().split('T')[0]

      const result = await createAppointment({
        hospital_id: hospital.id,
        department_id: department.id,
        appointment_date: appointmentDate,
        start_time: time,
        reason: reason || undefined,
      })

      if (result.success && result.reference_number) {
        setSuccess({ referenceNumber: result.reference_number })
      } else {
        setError(result.error || 'Failed to create appointment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (d: Date | null) => {
    if (!d) return ''
    return d.toLocaleDateString('en-GH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Success state
  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-h1 text-gray-900 mb-2">Booking Submitted!</h1>
        <p className="text-body text-gray-600 mb-6 max-w-md mx-auto">
          Your appointment request has been submitted and is awaiting hospital approval.
          You will receive a notification once the hospital confirms your booking.
        </p>

        <Card className="max-w-sm mx-auto mb-8">
          <CardContent className="p-6">
            <p className="text-body-sm text-gray-500 mb-1">{t('success.referenceNumber')}</p>
            <p className="text-h2 font-mono text-primary">{success.referenceNumber}</p>
            <p className="text-body-sm text-gray-500 mt-2">{t('success.saveReference')}</p>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/dashboard/appointments')}>
            {t('success.viewAppointments')}
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {tCommon('back')}
      </button>

      <h1 className="text-h1 text-gray-900 mb-6">{t('confirmation.title')}</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 text-error">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">{t('confirmation.appointmentDetails')}</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-500">{t('confirmation.hospital')}</p>
                    <p className="text-label text-gray-900">{hospital?.name}</p>
                    <p className="text-body-sm text-gray-500">{hospital?.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏥</span>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-500">{t('confirmation.department')}</p>
                    <p className="text-label text-gray-900">{department?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-500">{t('confirmation.date')} & {t('confirmation.time')}</p>
                    <p className="text-label text-gray-900">{formatDate(date)}</p>
                    <p className="text-body-sm text-gray-500">{time}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason for Visit */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">Reason for Visit</h2>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason for this appointment..."
                className="w-full h-24 p-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">{tNotifications('title')}</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotification}
                    onChange={(e) => setSmsNotification(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-body text-gray-700">{tNotifications('appointmentRemindersDesc')}</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-body text-gray-700">{tNotifications('emailNotificationsDesc')}</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">{t('confirmation.consultationFee')}</span>
                  <span className="text-gray-900">Free (NHIS)</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="warning">Pending Approval</Badge>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-body-sm text-gray-600">
                  {t('confirmation.terms')}{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    {tFooter('terms')}
                  </Link>{' '}
                  &{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    {tFooter('privacy')}
                  </Link>
                </span>
              </label>

              <Button
                size="lg"
                className="w-full"
                disabled={!termsAccepted}
                isLoading={isLoading}
                onClick={handleConfirm}
              >
                {t('confirmation.confirmButton')}
              </Button>

              <p className="text-body-sm text-gray-500 mt-4 text-center">
                {t('confirmation.cancellationNote')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
