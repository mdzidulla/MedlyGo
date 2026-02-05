'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  patient_id: string
  hospital_id: string
  department_id: string | null
  appointment_date: string
  appointment_time: string
  status: string
  reason: string | null
  reference_number: string | null
  created_at: string
  patients: {
    users: {
      full_name: string
      email: string
    }
  }
  hospitals: {
    name: string
  }
  departments: {
    name: string
  } | null
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filter, setFilter] = React.useState<FilterType>('all')

  const supabase = createClient()

  const fetchAppointments = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          hospital_id,
          department_id,
          appointment_date,
          appointment_time,
          status,
          reason,
          reference_number,
          created_at,
          patients(users(full_name, email)),
          hospitals(name),
          departments(name)
        `)
        .order('appointment_date', { ascending: false })

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

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchAppointments()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchAppointments])

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchQuery.toLowerCase()
    const patientName = apt.patients?.users?.full_name || ''
    const hospitalName = apt.hospitals?.name || ''
    const reference = apt.reference_number || ''

    const matchesSearch =
      patientName.toLowerCase().includes(searchLower) ||
      hospitalName.toLowerCase().includes(searchLower) ||
      reference.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    if (filter === 'all') return true
    return apt.status === filter
  })

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'error' | 'secondary' => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'completed':
        return 'info'
      case 'cancelled':
      case 'rejected':
        return 'error'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-gray-900">Appointments</h1>
        <p className="text-body text-gray-600">
          Overview of all appointments across the platform
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by patient name, hospital, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f} ({counts[f]})
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {searchQuery || filter !== 'all' ? 'No appointments found' : 'No appointments yet'}
            </h3>
            <p className="text-body text-gray-600">
              {searchQuery || filter !== 'all' ? 'Try a different search or filter' : 'Appointments will appear here when patients book'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-label text-gray-900">
                          {appointment.patients?.users?.full_name || 'Unknown Patient'}
                        </h3>
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        {appointment.reference_number && (
                          <span className="text-body-sm text-gray-500 font-mono">
                            {appointment.reference_number}
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-gray-600 mb-1">
                        {appointment.hospitals?.name || 'Unknown Hospital'}
                        {appointment.departments?.name && ` • ${appointment.departments.name}`}
                      </p>
                      {appointment.reason && (
                        <p className="text-body-sm text-gray-500 truncate">
                          Reason: {appointment.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right flex-shrink-0">
                    <p className="text-label text-gray-900">
                      {formatDate(appointment.appointment_date)}
                    </p>
                    <p className="text-body-sm text-gray-600">
                      {formatTime(appointment.appointment_time)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
