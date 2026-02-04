'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  hospital: { name: string } | null
  department: { name: string } | null
  appointment_date: string
  start_time: string
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reference_number: string
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

type TabType = 'all' | 'upcoming' | 'past' | 'cancelled'

export default function AppointmentsPage() {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tBooking = useTranslations('booking')

  const [activeTab, setActiveTab] = React.useState<TabType>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [appointments, setAppointments] = React.useState<Appointment[]>([])

  const supabase = createClient()

  React.useEffect(() => {
    async function fetchAppointments() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single() as { data: { id: string } | null }

        if (patient) {
          const { data } = await supabase
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
            .order('appointment_date', { ascending: false })

          if (data) {
            setAppointments(data as unknown as Appointment[])
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [supabase])

  const nowDateStr = new Date().toISOString().split('T')[0]

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.hospital?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reference_number.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (activeTab) {
      case 'upcoming':
        return apt.appointment_date >= nowDateStr && apt.status !== 'cancelled'
      case 'past':
        return apt.appointment_date < nowDateStr && apt.status === 'completed'
      case 'cancelled':
        return apt.status === 'cancelled'
      default:
        return true
    }
  })

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: tCommon('viewAll'), count: appointments.length },
    { key: 'upcoming', label: t('upcomingAppointments'), count: appointments.filter(a => a.appointment_date >= nowDateStr && a.status !== 'cancelled').length },
    { key: 'past', label: t('pastAppointments'), count: appointments.filter(a => a.appointment_date < nowDateStr && a.status === 'completed').length },
    { key: 'cancelled', label: t('status.cancelled'), count: appointments.filter(a => a.status === 'cancelled').length },
  ]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDateParts = (dateStr: string) => {
    const date = new Date(dateStr)
    return { day: date.getDate(), month: date.toLocaleDateString('en-GH', { month: 'short' }) }
  }

  const getStatusLabel = (status: string) => {
    return t(`status.${status === 'no_show' ? 'noShow' : status}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 rounded w-24" />)}</div>
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 text-gray-900">{tNav('myAppointments')}</h1>
          <p className="text-body text-gray-600">{t('quickActions.viewHistory')}</p>
        </div>
        <Link href="/dashboard/booking">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('quickActions.bookNew')}
          </Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
              <span className={cn('ml-2 px-2 py-0.5 rounded-full text-xs', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600')}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">{t('noUpcoming')}</h3>
            <p className="text-body text-gray-600 mb-4">{searchQuery ? tCommon('search') : t('bookFirst')}</p>
            <Link href="/dashboard/booking"><Button>{tNav('bookAppointment')}</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const dateParts = getDateParts(apt.appointment_date)
            const isUpcoming = apt.appointment_date >= nowDateStr

            return (
              <Card key={apt.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={cn(
                        'w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0',
                        apt.status === 'cancelled' ? 'bg-gray-100' : isUpcoming ? 'bg-primary-100' : 'bg-gray-100'
                      )}>
                        <span className={cn('text-h3 font-bold', apt.status === 'cancelled' ? 'text-gray-400' : isUpcoming ? 'text-primary' : 'text-gray-600')}>{dateParts.day}</span>
                        <span className={cn('text-xs uppercase', apt.status === 'cancelled' ? 'text-gray-400' : isUpcoming ? 'text-primary-600' : 'text-gray-500')}>{dateParts.month}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={cn('text-label', apt.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900')}>{apt.hospital?.name || tBooking('confirmation.hospital')}</h3>
                          <Badge variant={statusColors[apt.status]}>{getStatusLabel(apt.status)}</Badge>
                        </div>
                        <p className="text-body-sm text-gray-600">{apt.department?.name || tBooking('confirmation.department')}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-body-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {apt.start_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(apt.appointment_date)}
                          </span>
                          <span>Ref: {apt.reference_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col flex-shrink-0">
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 md:flex-none">{t('reschedule')}</Button>
                          <Button variant="ghost" size="sm" className="flex-1 md:flex-none text-error hover:text-error hover:bg-error/10">{t('cancel')}</Button>
                        </>
                      )}
                      {apt.status === 'completed' && <Button variant="outline" size="sm">{tBooking('success.bookAnother')}</Button>}
                      {apt.status === 'cancelled' && <Button variant="outline" size="sm">{tBooking('success.bookAnother')}</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
