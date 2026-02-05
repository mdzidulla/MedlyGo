'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { cancelAppointment, respondToSuggestion } from '@/lib/appointments/actions'

interface Appointment {
  id: string
  hospital: { name: string } | null
  department: { name: string } | null
  appointment_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'rejected' | 'suggested' | 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reference_number: string
  reason: string | null
  rejection_reason: string | null
  suggested_date: string | null
  suggested_time: string | null
  original_appointment_id: string | null
}

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'error',
  suggested: 'info',
  scheduled: 'info',
  checked_in: 'warning',
  in_progress: 'warning',
  completed: 'secondary',
  cancelled: 'error',
  no_show: 'error',
} as const

type TabType = 'upcoming' | 'pending' | 'suggested' | 'rejected' | 'cancelled' | 'past'

export default function AppointmentsPage() {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tBooking = useTranslations('booking')

  const [activeTab, setActiveTab] = React.useState<TabType>('upcoming')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = React.useState<string | null>(null)
  const [cancelReason, setCancelReason] = React.useState('')

  const supabase = createClient()

  const fetchAppointments = React.useCallback(async () => {
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
            reason,
            rejection_reason,
            suggested_date,
            suggested_time,
            original_appointment_id,
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
  }, [supabase])

  React.useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleCancelAppointment = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const result = await cancelAppointment(appointmentId, cancelReason || undefined)
      if (result.success) {
        await fetchAppointments()
        setCancelModalOpen(null)
        setCancelReason('')
      } else {
        alert(result.error || 'Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRespondToSuggestion = async (appointmentId: string, accept: boolean) => {
    setActionLoading(appointmentId)
    try {
      const result = await respondToSuggestion(appointmentId, accept)
      if (result.success) {
        await fetchAppointments()
      } else {
        alert(result.error || 'Failed to respond to suggestion')
      }
    } catch (error) {
      console.error('Error responding to suggestion:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const nowDateStr = new Date().toISOString().split('T')[0]

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.hospital?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reference_number.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (activeTab) {
      case 'upcoming':
        return apt.status === 'confirmed' && apt.appointment_date >= nowDateStr
      case 'pending':
        return apt.status === 'pending'
      case 'suggested':
        return apt.status === 'suggested'
      case 'rejected':
        return apt.status === 'rejected'
      case 'cancelled':
        return apt.status === 'cancelled'
      case 'past':
        return apt.status === 'completed' || (apt.status === 'confirmed' && apt.appointment_date < nowDateStr)
      default:
        return true
    }
  })

  // Count appointments for each tab
  const counts = {
    upcoming: appointments.filter(a => a.status === 'confirmed' && a.appointment_date >= nowDateStr).length,
    pending: appointments.filter(a => a.status === 'pending').length,
    suggested: appointments.filter(a => a.status === 'suggested').length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    past: appointments.filter(a => a.status === 'completed' || (a.status === 'confirmed' && a.appointment_date < nowDateStr)).length,
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'upcoming', label: t('upcomingAppointments'), count: counts.upcoming },
    { key: 'pending', label: t('tabs.pending') || 'Pending', count: counts.pending },
    { key: 'suggested', label: t('tabs.suggested') || 'Suggested', count: counts.suggested },
    { key: 'rejected', label: t('tabs.rejected') || 'Rejected', count: counts.rejected },
    { key: 'cancelled', label: t('status.cancelled'), count: counts.cancelled },
    { key: 'past', label: t('pastAppointments'), count: counts.past },
  ]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDateParts = (dateStr: string) => {
    const date = new Date(dateStr)
    return { day: date.getDate(), month: date.toLocaleDateString('en-GH', { month: 'short' }) }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('status.pending') || 'Pending',
      confirmed: t('status.confirmed'),
      rejected: t('status.rejected') || 'Rejected',
      suggested: t('status.suggested') || 'Suggested',
      scheduled: t('status.scheduled'),
      checked_in: t('status.checkedIn'),
      in_progress: t('status.inProgress'),
      completed: t('status.completed'),
      cancelled: t('status.cancelled'),
      no_show: t('status.noShow'),
    }
    return statusMap[status] || status
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2 mb-6">{[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-gray-200 rounded w-24" />)}</div>
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-h3 text-gray-900 mb-4">{t('cancelAppointment') || 'Cancel Appointment'}</h3>
              <p className="text-body text-gray-600 mb-4">{t('cancelConfirmation') || 'Are you sure you want to cancel this appointment?'}</p>
              <textarea
                placeholder={t('cancelReasonPlaceholder') || 'Reason for cancellation (optional)'}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCancelModalOpen(null)
                    setCancelReason('')
                  }}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleCancelAppointment(cancelModalOpen)}
                  disabled={actionLoading === cancelModalOpen}
                >
                  {actionLoading === cancelModalOpen ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('cancelling') || 'Cancelling...'}
                    </span>
                  ) : (
                    t('confirmCancel') || 'Yes, Cancel'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Tab-specific help text */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-body-sm text-warning-700">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('pendingHelp') || 'These appointments are awaiting hospital approval. You will be notified once they are confirmed.'}
          </p>
        </div>
      )}

      {activeTab === 'suggested' && counts.suggested > 0 && (
        <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-lg">
          <p className="text-body-sm text-info-700">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('suggestedHelp') || 'The hospital has suggested an alternative time for these appointments. Please accept or reject the suggestion.'}
          </p>
        </div>
      )}

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {activeTab === 'upcoming' && (t('noUpcoming') || 'No upcoming appointments')}
              {activeTab === 'pending' && (t('noPending') || 'No pending appointments')}
              {activeTab === 'suggested' && (t('noSuggested') || 'No suggested appointments')}
              {activeTab === 'rejected' && (t('noRejected') || 'No rejected appointments')}
              {activeTab === 'cancelled' && (t('noCancelled') || 'No cancelled appointments')}
              {activeTab === 'past' && (t('noPast') || 'No past appointments')}
            </h3>
            <p className="text-body text-gray-600 mb-4">
              {searchQuery ? tCommon('search') : t('bookFirst')}
            </p>
            <Link href="/dashboard/booking"><Button>{tNav('bookAppointment')}</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const dateParts = getDateParts(apt.appointment_date)
            const isUpcoming = apt.appointment_date >= nowDateStr
            const isActionLoading = actionLoading === apt.id

            return (
              <Card key={apt.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={cn(
                        'w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0',
                        apt.status === 'cancelled' || apt.status === 'rejected' ? 'bg-gray-100' :
                        apt.status === 'pending' ? 'bg-warning/10' :
                        apt.status === 'suggested' ? 'bg-info/10' :
                        isUpcoming ? 'bg-primary-100' : 'bg-gray-100'
                      )}>
                        <span className={cn(
                          'text-h3 font-bold',
                          apt.status === 'cancelled' || apt.status === 'rejected' ? 'text-gray-400' :
                          apt.status === 'pending' ? 'text-warning' :
                          apt.status === 'suggested' ? 'text-info' :
                          isUpcoming ? 'text-primary' : 'text-gray-600'
                        )}>{dateParts.day}</span>
                        <span className={cn(
                          'text-xs uppercase',
                          apt.status === 'cancelled' || apt.status === 'rejected' ? 'text-gray-400' :
                          apt.status === 'pending' ? 'text-warning-600' :
                          apt.status === 'suggested' ? 'text-info-600' :
                          isUpcoming ? 'text-primary-600' : 'text-gray-500'
                        )}>{dateParts.month}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={cn('text-label', apt.status === 'cancelled' || apt.status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900')}>{apt.hospital?.name || tBooking('confirmation.hospital')}</h3>
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

                        {/* Show reason for visit if available */}
                        {apt.reason && (
                          <p className="mt-2 text-body-sm text-gray-600">
                            <span className="font-medium">{t('reasonForVisit') || 'Reason'}:</span> {apt.reason}
                          </p>
                        )}

                        {/* Show rejection reason if rejected */}
                        {apt.status === 'rejected' && apt.rejection_reason && (
                          <p className="mt-2 text-body-sm text-error">
                            <span className="font-medium">{t('rejectionReason') || 'Reason'}:</span> {apt.rejection_reason}
                          </p>
                        )}

                        {/* Show suggested alternative for suggested appointments */}
                        {apt.status === 'suggested' && (apt.suggested_date || apt.suggested_time) && (
                          <div className="mt-3 p-3 bg-info/5 border border-info/20 rounded-lg">
                            <p className="text-body-sm font-medium text-info-700 mb-1">{t('suggestedAlternative') || 'Suggested Alternative'}:</p>
                            <p className="text-body-sm text-gray-700">
                              {apt.suggested_date && formatDate(apt.suggested_date)}
                              {apt.suggested_date && apt.suggested_time && ' at '}
                              {apt.suggested_time}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions based on status */}
                    <div className="flex gap-2 md:flex-col flex-shrink-0">
                      {/* Upcoming (confirmed) - Reschedule & Cancel */}
                      {apt.status === 'confirmed' && isUpcoming && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 md:flex-none">{t('reschedule')}</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none text-error hover:text-error hover:bg-error/10"
                            onClick={() => setCancelModalOpen(apt.id)}
                          >
                            {t('cancel')}
                          </Button>
                        </>
                      )}

                      {/* Pending - Cancel only */}
                      {apt.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 md:flex-none text-error hover:text-error hover:bg-error/10"
                          onClick={() => setCancelModalOpen(apt.id)}
                          disabled={isActionLoading}
                        >
                          {t('cancel')}
                        </Button>
                      )}

                      {/* Suggested - Accept & Reject */}
                      {apt.status === 'suggested' && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none"
                            onClick={() => handleRespondToSuggestion(apt.id, true)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              t('acceptSuggestion') || 'Accept'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 md:flex-none text-error hover:text-error hover:bg-error/10"
                            onClick={() => handleRespondToSuggestion(apt.id, false)}
                            disabled={isActionLoading}
                          >
                            {t('rejectSuggestion') || 'Reject'}
                          </Button>
                        </>
                      )}

                      {/* Rejected - Book Again */}
                      {apt.status === 'rejected' && (
                        <Link href="/dashboard/booking">
                          <Button variant="outline" size="sm">{t('bookAgain') || 'Book Again'}</Button>
                        </Link>
                      )}

                      {/* Completed - Leave Feedback */}
                      {apt.status === 'completed' && (
                        <Button variant="outline" size="sm">{t('leaveFeedback') || 'Leave Feedback'}</Button>
                      )}

                      {/* Cancelled - Book Again */}
                      {apt.status === 'cancelled' && (
                        <Link href="/dashboard/booking">
                          <Button variant="outline" size="sm">{tBooking('success.bookAnother')}</Button>
                        </Link>
                      )}
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
