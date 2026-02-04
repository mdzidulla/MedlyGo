'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock data for hospitals
const hospitals = [
  {
    id: '1',
    name: 'Korle Bu Teaching Hospital',
    address: 'Guggisberg Ave, Accra',
    city: 'Accra',
    region: 'Greater Accra Region',
    distance: '2.3 km',
    rating: 4.2,
    totalReviews: 1247,
    is24Hours: true,
    imageUrl: null,
  },
  {
    id: '2',
    name: '37 Military Hospital',
    address: '37 Military Hospital Road, Accra',
    city: 'Accra',
    region: 'Greater Accra Region',
    distance: '4.1 km',
    rating: 4.5,
    totalReviews: 892,
    is24Hours: true,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Ridge Hospital',
    address: 'Castle Road, Accra',
    city: 'Accra',
    region: 'Greater Accra Region',
    distance: '3.8 km',
    rating: 4.0,
    totalReviews: 654,
    is24Hours: true,
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Komfo Anokye Teaching Hospital',
    address: 'Bantama, Kumasi',
    city: 'Kumasi',
    region: 'Ashanti Region',
    distance: '250 km',
    rating: 4.3,
    totalReviews: 1089,
    is24Hours: true,
    imageUrl: null,
  },
]

// Mock data for departments
const departments = [
  { id: '1', name: 'General Medicine', icon: '🩺', description: 'General health consultations and check-ups' },
  { id: '2', name: 'Pediatrics', icon: '👶', description: 'Healthcare for infants, children, and adolescents' },
  { id: '3', name: 'Obstetrics & Gynecology', icon: '🤰', description: "Women's health and prenatal care" },
  { id: '4', name: 'Cardiology', icon: '❤️', description: 'Heart and cardiovascular system' },
  { id: '5', name: 'Orthopedics', icon: '🦴', description: 'Bones, joints, and musculoskeletal system' },
  { id: '6', name: 'Dermatology', icon: '🧴', description: 'Skin, hair, and nail conditions' },
  { id: '7', name: 'ENT', icon: '👂', description: 'Ear, nose, and throat' },
  { id: '8', name: 'Ophthalmology', icon: '👁️', description: 'Eye care and vision' },
  { id: '9', name: 'Dental', icon: '🦷', description: 'Oral health and dental care' },
  { id: '10', name: 'Neurology', icon: '🧠', description: 'Brain and nervous system' },
]

type BookingStep = 'hospital' | 'department' | 'datetime' | 'confirm'

export default function BookPage() {
  const router = useRouter()

  const [step, setStep] = React.useState<BookingStep>('hospital')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedHospital, setSelectedHospital] = React.useState<typeof hospitals[0] | null>(null)
  const [selectedDepartment, setSelectedDepartment] = React.useState<typeof departments[0] | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

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
      dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectHospital = (hospital: typeof hospitals[0]) => {
    setSelectedHospital(hospital)
    setStep('department')
    setSearchQuery('')
  }

  const handleSelectDepartment = (department: typeof departments[0]) => {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Hospital', 'Department', 'Date & Time', 'Confirm'].map((label, index) => {
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
          <h1 className="text-h1 text-gray-900 mb-2">Select Hospital</h1>
          <p className="text-body text-gray-600 mb-6">
            Choose from public hospitals across Ghana
          </p>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search hospitals..."
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
              Near Me
            </Button>
          </div>

          {/* Hospital List */}
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
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-body-sm text-gray-600">
                              {hospital.rating} ({hospital.totalReviews.toLocaleString()} reviews)
                            </span>
                          </div>
                          {hospital.is24Hours && (
                            <Badge variant="success">Open 24/7</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-body-sm text-gray-500">{hospital.distance}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            Back
          </button>

          <h1 className="text-h1 text-gray-900 mb-2">Select Department</h1>
          <p className="text-body text-gray-600 mb-6">
            {selectedHospital?.name}
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Input
              placeholder="Search departments or describe symptoms..."
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

          {/* AI Assistant Link */}
          <div className="mb-6 p-4 bg-primary-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-label text-gray-900">Not sure which department?</h3>
                <p className="text-body-sm text-gray-600">
                  Describe your symptoms to our AI assistant and get a recommendation.
                </p>
                <Button variant="link" className="p-0 h-auto mt-1">
                  Talk to AI Assistant →
                </Button>
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <Card
                key={dept.id}
                className="cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => handleSelectDepartment(dept)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dept.icon}</span>
                    <div>
                      <h3 className="text-label text-gray-900">{dept.name}</h3>
                      <p className="text-body-sm text-gray-500 line-clamp-1">{dept.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
  hospital: typeof hospitals[0] | null
  department: typeof departments[0] | null
  selectedDate: Date | null
  selectedTime: string | null
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  onBack: () => void
  onContinue: () => void
}) {
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

  // Mock time slots
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
        Back
      </button>

      <h1 className="text-h1 text-gray-900 mb-2">Select Date & Time</h1>
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
            <h2 className="text-h3 text-gray-900 mb-4">Available Slots</h2>

            {!selectedDate ? (
              <p className="text-body text-gray-500">Please select a date first</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-label text-gray-700 mb-3">Morning</h3>
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
                  <h3 className="text-label text-gray-700 mb-3">Afternoon</h3>
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
          Continue to Confirmation
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
  hospital: typeof hospitals[0] | null
  department: typeof departments[0] | null
  date: Date | null
  time: string | null
  onBack: () => void
}) {
  const router = useRouter()
  const [reason, setReason] = React.useState('')
  const [smsNotification, setSmsNotification] = React.useState(true)
  const [emailNotification, setEmailNotification] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)

  const handleConfirm = async () => {
    if (!termsAccepted) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push('/dashboard?booking=success')
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

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-h1 text-gray-900 mb-6">Confirm Your Booking</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">Appointment Details</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-500">Hospital</p>
                    <p className="text-label text-gray-900">{hospital?.name}</p>
                    <p className="text-body-sm text-gray-500">{hospital?.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{department?.icon}</span>
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-500">Department</p>
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
                    <p className="text-body-sm text-gray-500">Date & Time</p>
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
              <h2 className="text-h3 text-gray-900 mb-4">Reason for Visit (Optional)</h2>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for the appointment..."
                className="w-full h-24 p-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">Notification Preferences</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotification}
                    onChange={(e) => setSmsNotification(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-body text-gray-700">SMS reminders</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-body text-gray-700">Email reminders</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-h3 text-gray-900 mb-4">Booking Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">Consultation Fee</span>
                  <span className="text-gray-900">Free (NHIS)</span>
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
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
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
                Confirm Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
