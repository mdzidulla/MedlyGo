'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  hospital: { name: string } | null
  department: { name: string } | null
  appointment_date: string
  start_time: string
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reference_number: string
}

interface UserProfile {
  full_name: string
  email: string | null
  phone: string | null
}

const statusColors = {
  scheduled: 'info',
  confirmed: 'success',
  checked_in: 'warning',
  in_progress: 'warning',
  completed: 'secondary',
  cancelled: 'error',
  no_show: 'error',
} as const

function DashboardContent() {
  const searchParams = useSearchParams()
  const bookingSuccess = searchParams.get('booking') === 'success'
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tBooking = useTranslations('booking')
  const tNav = useTranslations('nav')

  const [showSuccessMessage, setShowSuccessMessage] = React.useState(bookingSuccess)
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = React.useState<Appointment[]>([])

  const supabase = createClient()

  React.useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [bookingSuccess])

  React.useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, email, phone')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setUser(profile as UserProfile)
        }

        // Get patient record
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', authUser.id)
          .single() as { data: { id: string } | null }

        if (patient) {
          const now = new Date().toISOString().split('T')[0]

          // Get upcoming appointments
          const { data: upcoming } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              start_time,
              status,
              reference_number,
              hospital:hospitals(name),
              department:departments(name)
            `)
            .eq('patient_id', patient.id)
            .gte('appointment_date', now)
            .neq('status', 'cancelled')
            .order('appointment_date', { ascending: true })
            .limit(5)

          if (upcoming) {
            setUpcomingAppointments(upcoming as unknown as Appointment[])
          }

          // Get past appointments
          const { data: past } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              start_time,
              status,
              reference_number,
              hospital:hospitals(name),
              department:departments(name)
            `)
            .eq('patient_id', patient.id)
            .lt('appointment_date', now)
            .order('appointment_date', { ascending: false })
            .limit(3)

          if (past) {
            setPastAppointments(past as unknown as Appointment[])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning')
    if (hour < 17) return t('greeting.afternoon')
    return t('greeting.evening')
  }

  const getFirstName = () => {
    if (!user?.full_name) return ''
    return user.full_name.split(' ')[0]
  }

  const getDateParts = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-GH', { month: 'short' }),
    }
  }

  const getStatusLabel = (status: string) => {
    const statusKey = status.replace('_', '') as keyof typeof statusColors
    return t(`status.${status === 'no_show' ? 'noShow' : status}`)
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-label text-success">{tBooking('success.title')}</p>
              <p className="text-body-sm text-gray-600">
                {tBooking('success.message')}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSuccessMessage(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 text-gray-900">
            {getGreeting()}{getFirstName() ? `, ${getFirstName()}` : ''}!
          </h1>
          <p className="text-body text-gray-600">
            {upcomingAppointments.length === 0
              ? t('noUpcoming')
              : `${upcomingAppointments.length} ${t('upcomingAppointments').toLowerCase()}`}
          </p>
        </div>

        <Link href="/dashboard/booking">
          <Button size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('quickActions.bookNew')}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointments */}
          <section>
            <h2 className="text-h2 text-gray-900 mb-4">{t('upcomingAppointments')}</h2>

            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-h3 text-gray-900 mb-2">{t('noUpcoming')}</h3>
                  <p className="text-body text-gray-600 mb-4">{t('bookFirst')}</p>
                  <Link href="/dashboard/booking">
                    <Button>{tNav('bookAppointment')}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => {
                  const dateParts = getDateParts(apt.appointment_date)
                  return (
                    <Card key={apt.id} className="hover:shadow-card-hover transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="w-14 h-14 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-h3 text-primary font-bold">{dateParts.day}</span>
                              <span className="text-xs text-primary-600 uppercase">{dateParts.month}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-label text-gray-900">{apt.hospital?.name || tBooking('confirmation.hospital')}</h3>
                                <Badge variant={statusColors[apt.status]}>
                                  {getStatusLabel(apt.status)}
                                </Badge>
                              </div>
                              <p className="text-body-sm text-gray-600">{apt.department?.name || tBooking('confirmation.department')}</p>
                              <div className="flex items-center gap-4 mt-2 text-body-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {apt.start_time}
                                </span>
                                <span>Ref: {apt.reference_number}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-col">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">{t('reschedule')}</Button>
                            <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-error hover:text-error hover:bg-error/10">{t('cancel')}</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-h2 text-gray-900 mb-4">{t('pastAppointments')}</h2>
              <div className="space-y-4">
                {pastAppointments.map((apt) => {
                  const dateParts = getDateParts(apt.appointment_date)
                  return (
                    <Card key={apt.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-h3 text-gray-600 font-bold">{dateParts.day}</span>
                              <span className="text-xs text-gray-500 uppercase">{dateParts.month}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-label text-gray-900">{apt.hospital?.name || tBooking('confirmation.hospital')}</h3>
                                <Badge variant={statusColors[apt.status]}>
                                  {getStatusLabel(apt.status)}
                                </Badge>
                              </div>
                              <p className="text-body-sm text-gray-600">{apt.department?.name || tBooking('confirmation.department')}</p>
                              <p className="text-body-sm text-gray-500 mt-1">Ref: {apt.reference_number}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">{tBooking('success.bookAnother')}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard/appointments">
                  <Button variant="ghost">{tCommon('viewAll')} →</Button>
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/booking" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('quickActions.bookNew')}
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {tNav('support')}
              </Button>
              <Link href="/dashboard/appointments" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t('quickActions.viewHistory')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>{tNav('profile')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-h3 font-bold">
                  {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-label text-gray-900">{user?.full_name || tCommon('patient')}</p>
                  <p className="text-body-sm text-gray-500">{tCommon('patient')}</p>
                </div>
              </div>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="w-full">{tCommon('edit')} {tNav('profile')}</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-primary-50 border-primary-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-label text-gray-900">{tNav('helpCenter')}</h3>
                  <p className="text-body-sm text-gray-600 mb-3">{tNav('support')}</p>
                  <Link href="/dashboard/support">
                    <Button variant="link" className="p-0 h-auto">{tNav('contact')} →</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </React.Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
