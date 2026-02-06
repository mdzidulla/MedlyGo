'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { approveAppointment, rejectAppointment, suggestAlternative } from '@/lib/appointments/provider-actions'

interface Appointment {
  id: string
  reference_number: string
  appointment_date: string
  start_time: string
  status: 'pending' | 'confirmed' | 'rejected' | 'suggested' | 'cancelled' | 'completed'
  reason: string | null
  patient: {
    users: {
      full_name: string
      phone: string | null
    }
  } | null
  department: {
    name: string
  } | null
}

type TabType = 'pending' | 'confirmed' | 'all'

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'error',
  suggested: 'info',
  cancelled: 'secondary',
  completed: 'secondary',
} as const

export default function ProviderAppointmentsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('pending')
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [suggestModalOpen, setSuggestModalOpen] = React.useState<string | null>(null)
  const [suggestedDate, setSuggestedDate] = React.useState('')
  const [suggestedTime, setSuggestedTime] = React.useState('')
  const [suggestReason, setSuggestReason] = React.useState('')
  const [detailModalOpen, setDetailModalOpen] = React.useState<string | null>(null)

  const supabase = createClient()

  const fetchAppointments = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get hospital ID - check providers table first, then hospital email
      let hospitalId: string | null = null
      const client: any = supabase

      const { data: providerData } = await client
        .from('providers')
        .select('hospital_id')
        .eq('user_id', user.id)
        .single()

      if (providerData) {
        hospitalId = providerData.hospital_id
      } else {
        // Check if user email matches a hospital email
        const { data: hospitalByEmail } = await client
          .from('hospitals')
          .select('id')
          .eq('email', user.email)
          .single()

        if (hospitalByEmail) {
          hospitalId = hospitalByEmail.id
        }
      }

      if (!hospitalId) {
        console.error('Hospital not found for this user')
        setIsLoading(false)
        return
      }

      // Fetch appointments for this hospital
      const { data, error } = await client
        .from('appointments')
        .select(`
          id,
          reference_number,
          appointment_date,
          start_time,
          status,
          reason,
          patient:patients(
            id,
            user_id,
            users(full_name, phone)
          ),
          department:departments(name)
        `)
        .eq('hospital_id', hospitalId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
      } else if (data) {
        setAppointments(data as unknown as Appointment[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleApprove = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const result = await approveAppointment(appointmentId)
      if (result.success) {
        await fetchAppointments()
      } else {
        alert(result.error || 'Failed to approve appointment')
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModalOpen || !rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setActionLoading(rejectModalOpen)
    try {
      const result = await rejectAppointment(rejectModalOpen, rejectReason)
      if (result.success) {
        setRejectModalOpen(null)
        setRejectReason('')
        await fetchAppointments()
      } else {
        alert(result.error || 'Failed to reject appointment')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuggestAlternative = async () => {
    if (!suggestModalOpen || !suggestedDate || !suggestedTime) {
      alert('Please provide a date and time')
      return
    }

    setActionLoading(suggestModalOpen)
    try {
      const result = await suggestAlternative(
        suggestModalOpen,
        suggestedDate,
        suggestedTime,
        suggestReason || undefined
      )
      if (result.success) {
        setSuggestModalOpen(null)
        setSuggestedDate('')
        setSuggestedTime('')
        setSuggestReason('')
        await fetchAppointments()
      } else {
        alert(result.error || 'Failed to suggest alternative')
      }
    } catch (error) {
      console.error('Error suggesting:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const nowDateStr = new Date().toISOString().split('T')[0]

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.patient?.users?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (activeTab) {
      case 'pending':
        return apt.status === 'pending'
      case 'confirmed':
        return apt.status === 'confirmed' && apt.appointment_date >= nowDateStr
      case 'all':
        return true
      default:
        return true
    }
  })

  // Counts
  const counts = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed' && a.appointment_date >= nowDateStr).length,
    all: appointments.length,
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending Approval', count: counts.pending },
    { key: 'confirmed', label: 'Upcoming', count: counts.confirmed },
    { key: 'all', label: 'All Appointments', count: counts.all },
  ]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      suggested: 'Alternative Suggested',
      cancelled: 'Cancelled',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  // Generate time slots for suggestion modal
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="flex gap-2 mb-6">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 rounded w-32" />)}</div>
        <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}</div>
      </div>
    )
  }

  // Get appointment details for modal
  const getAppointmentById = (id: string) => appointments.find(a => a.id === id)

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              {(() => {
                const apt = getAppointmentById(detailModalOpen)
                if (!apt) return null
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-h3 text-gray-900">Appointment Details</h3>
                      <button
                        onClick={() => setDetailModalOpen(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Patient Info */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-label text-gray-700 mb-2">Patient Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Name</span>
                            <span className="text-body-sm text-gray-900 font-medium">
                              {apt.patient?.users?.full_name || 'Unknown'}
                            </span>
                          </div>
                          {apt.patient?.users?.phone && (
                            <div className="flex justify-between">
                              <span className="text-body-sm text-gray-500">Phone</span>
                              <span className="text-body-sm text-gray-900">{apt.patient.users.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Appointment Info */}
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <h4 className="text-label text-gray-700 mb-2">Appointment Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Reference</span>
                            <span className="text-body-sm text-gray-900 font-mono">{apt.reference_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Date</span>
                            <span className="text-body-sm text-gray-900">{formatDate(apt.appointment_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Time</span>
                            <span className="text-body-sm text-gray-900">{apt.start_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Department</span>
                            <span className="text-body-sm text-gray-900">{apt.department?.name || 'General'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-body-sm text-gray-500">Status</span>
                            <Badge variant={statusColors[apt.status]}>
                              {getStatusLabel(apt.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {apt.reason && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h4 className="text-label text-gray-700 mb-2">Reason for Visit</h4>
                          <p className="text-body-sm text-gray-900">{apt.reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setDetailModalOpen(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-h3 text-gray-900 mb-4">Reject Appointment</h3>
              <p className="text-body text-gray-600 mb-4">
                Please provide a reason for rejecting this appointment. The patient will be notified.
              </p>
              <textarea
                placeholder="Reason for rejection (required)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRejectModalOpen(null)
                    setRejectReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={actionLoading === rejectModalOpen || !rejectReason.trim()}
                >
                  {actionLoading === rejectModalOpen ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggest Alternative Modal */}
      {suggestModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-h3 text-gray-900 mb-4">Suggest Alternative</h3>
              <p className="text-body text-gray-600 mb-4">
                Suggest an alternative date and time for this appointment.
              </p>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-label text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    min={nowDateStr}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-1">Time</label>
                  <select
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-1">Reason (optional)</label>
                  <textarea
                    placeholder="Why you're suggesting this alternative..."
                    value={suggestReason}
                    onChange={(e) => setSuggestReason(e.target.value)}
                    className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSuggestModalOpen(null)
                    setSuggestedDate('')
                    setSuggestedTime('')
                    setSuggestReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSuggestAlternative}
                  disabled={actionLoading === suggestModalOpen || !suggestedDate || !suggestedTime}
                >
                  {actionLoading === suggestModalOpen ? 'Sending...' : 'Send Suggestion'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-h1 text-gray-900">Appointment Management</h1>
        <p className="text-body text-gray-600">
          Review and manage patient appointments
        </p>
      </div>

      {/* Pending Alert */}
      {counts.pending > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-label text-warning-700">
              You have {counts.pending} appointment{counts.pending > 1 ? 's' : ''} pending approval
            </p>
            <p className="text-body-sm text-warning-600">
              Please review and respond to these requests
            </p>
          </div>
        </div>
      )}

      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by patient name, reference, or department..."
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
              <span className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600',
                tab.key === 'pending' && tab.count > 0 && activeTab !== tab.key && 'bg-warning text-white'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {activeTab === 'pending' && 'No pending appointments'}
              {activeTab === 'confirmed' && 'No upcoming appointments'}
              {activeTab === 'all' && 'No appointments found'}
            </h3>
            <p className="text-body text-gray-600">
              {searchQuery ? 'Try a different search term' : 'Appointments will appear here when patients book'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    {/* Date Block */}
                    <div className={cn(
                      'w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0',
                      apt.status === 'pending' ? 'bg-warning/10' : 'bg-primary-100'
                    )}>
                      <span className={cn(
                        'text-h3 font-bold',
                        apt.status === 'pending' ? 'text-warning' : 'text-primary'
                      )}>
                        {new Date(apt.appointment_date).getDate()}
                      </span>
                      <span className={cn(
                        'text-xs uppercase',
                        apt.status === 'pending' ? 'text-warning-600' : 'text-primary-600'
                      )}>
                        {new Date(apt.appointment_date).toLocaleDateString('en-GH', { month: 'short' })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-label text-gray-900">
                          {apt.patient?.users?.full_name || 'Unknown Patient'}
                        </h3>
                        <Badge variant={statusColors[apt.status]}>
                          {getStatusLabel(apt.status)}
                        </Badge>
                      </div>

                      <p className="text-body-sm text-gray-600 mb-2">
                        {apt.department?.name || 'General'} • {apt.start_time}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(apt.appointment_date)}
                        </span>
                        <span>Ref: {apt.reference_number}</span>
                        {apt.patient?.users?.phone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {apt.patient.users.phone}
                          </span>
                        )}
                      </div>

                      {apt.reason && (
                        <p className="mt-2 text-body-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {apt.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {apt.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(apt.id)}
                        disabled={actionLoading === apt.id}
                      >
                        {actionLoading === apt.id ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSuggestModalOpen(apt.id)}
                        disabled={actionLoading === apt.id}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Suggest
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-error hover:text-error hover:bg-error/10"
                        onClick={() => setRejectModalOpen(apt.id)}
                        disabled={actionLoading === apt.id}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </Button>
                    </div>
                  )}

                  {apt.status === 'confirmed' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(apt.id)}>
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
