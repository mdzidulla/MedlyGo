'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TodayStats {
  total: number
  completed: number
  confirmed: number
  pending: number
  checkedIn: number
  noShows: number
}

interface QueueAppointment {
  id: string
  reference_number: string
  start_time: string
  status: string
  reason: string | null
  checked_in_at: string | null
  appointment_date?: string
  patient: {
    id: string
    user_id: string
    users: {
      full_name: string
      phone: string | null
    }
  } | null
  department: {
    name: string
  } | null
}

interface UpcomingAppointment {
  id: string
  reference_number: string
  start_time: string
  status: string
  appointment_date: string
  patient: {
    id: string
    user_id: string
    users: {
      full_name: string
      phone: string | null
    }
  } | null
  department: {
    name: string
  } | null
}

interface RecentActivity {
  id: string
  type: 'completed' | 'checked_in' | 'approved' | 'new_booking'
  patientName: string
  time: string
  timestamp: Date
}

interface HospitalInfo {
  id: string
  name: string
  type: 'public' | 'private'
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  checked_in: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

export default function ProviderDashboard() {
  const [hospital, setHospital] = React.useState<HospitalInfo | null>(null)
  const [todayStats, setTodayStats] = React.useState<TodayStats>({
    total: 0,
    completed: 0,
    confirmed: 0,
    pending: 0,
    checkedIn: 0,
    noShows: 0,
  })
  const [queue, setQueue] = React.useState<QueueAppointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<UpcomingAppointment[]>([])
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const supabase = createClient()
  // eslint-disable-next-line
  const client = supabase as any

  const today = new Date().toISOString().split('T')[0]

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get provider's hospital - for hospital staff, check users table for hospital_id
      // Or check if they're linked via providers table
      let hospitalId: string | null = null

      // First try providers table (for doctors/staff)
      const { data: provider } = await client
        .from('providers')
        .select('hospital_id')
        .eq('user_id', user.id)
        .single()

      if (provider) {
        hospitalId = provider.hospital_id
      } else {
        // Check if user email matches a hospital email (for hospital admin login)
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
        console.error('No hospital found for user')
        setIsLoading(false)
        return
      }

      // Fetch hospital info
      const { data: hospitalData } = await client
        .from('hospitals')
        .select('id, name, type')
        .eq('id', hospitalId)
        .single()

      if (hospitalData) {
        setHospital(hospitalData)
      }

      // Fetch today's appointments for stats
      const { data: todayAppointments } = await client
        .from('appointments')
        .select('id, status, checked_in_at, appointment_date')
        .eq('hospital_id', hospitalId)
        .eq('appointment_date', today)

      if (todayAppointments) {
        const stats: TodayStats = {
          total: todayAppointments.length,
          completed: todayAppointments.filter((a: { status: string }) => a.status === 'completed').length,
          confirmed: todayAppointments.filter((a: { status: string }) => a.status === 'confirmed').length,
          pending: todayAppointments.filter((a: { status: string }) => a.status === 'pending').length,
          checkedIn: todayAppointments.filter((a: { status: string }) => a.status === 'checked_in').length,
          noShows: todayAppointments.filter((a: { status: string }) => a.status === 'no_show').length,
        }
        setTodayStats(stats)
      }

      // Fetch patient queue (today's confirmed/checked-in appointments)
      const { data: queueData } = await client
        .from('appointments')
        .select(`
          id,
          reference_number,
          start_time,
          status,
          reason,
          checked_in_at,
          appointment_date,
          patient:patients(
            id,
            user_id,
            users(full_name, phone)
          ),
          department:departments(name)
        `)
        .eq('hospital_id', hospitalId)
        .eq('appointment_date', today)
        .in('status', ['confirmed', 'checked_in', 'in_progress'])
        .order('start_time', { ascending: true })

      // Fetch upcoming appointments (future dates, confirmed status)
      const { data: upcomingData } = await client
        .from('appointments')
        .select(`
          id,
          reference_number,
          start_time,
          status,
          appointment_date,
          patient:patients(
            id,
            user_id,
            users(full_name, phone)
          ),
          department:departments(name)
        `)
        .eq('hospital_id', hospitalId)
        .gt('appointment_date', today)
        .in('status', ['confirmed', 'pending'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5)

      if (upcomingData) {
        setUpcomingAppointments(upcomingData)
      }

      if (queueData) {
        setQueue(queueData)
      }

      // Fetch recent activity (last 10 appointment updates)
      const { data: recentAppointments } = await client
        .from('appointments')
        .select(`
          id,
          status,
          updated_at,
          checked_in_at,
          completed_at,
          patient:patients(
            users(full_name)
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (recentAppointments) {
        const activities: RecentActivity[] = recentAppointments
          .filter((a: { patient: { users: { full_name: string } } | null }) => a.patient?.users?.full_name)
          .map((a: {
            id: string
            status: string
            updated_at: string
            checked_in_at: string | null
            completed_at: string | null
            patient: { users: { full_name: string } } | null
          }) => {
            let type: RecentActivity['type'] = 'new_booking'
            let timestamp = new Date(a.updated_at)

            if (a.status === 'completed' && a.completed_at) {
              type = 'completed'
              timestamp = new Date(a.completed_at)
            } else if (a.status === 'checked_in' && a.checked_in_at) {
              type = 'checked_in'
              timestamp = new Date(a.checked_in_at)
            } else if (a.status === 'confirmed') {
              type = 'approved'
            }

            return {
              id: a.id,
              type,
              patientName: a.patient?.users?.full_name || 'Unknown',
              time: formatTimeAgo(timestamp),
              timestamp,
            }
          })
        setRecentActivity(activities)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const calculateWaitTime = (checkedInAt: string | null, startTime: string): string => {
    if (!checkedInAt) return '-'

    const checkedIn = new Date(checkedInAt)
    const now = new Date()
    const diffMs = now.getTime() - checkedIn.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just arrived'
    return `${diffMins} min${diffMins > 1 ? 's' : ''}`
  }

  const handleCheckIn = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const { error } = await client
        .from('appointments')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error
      await fetchDashboardData()
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in patient')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartConsultation = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const { error } = await client
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', appointmentId)

      if (error) throw error
      await fetchDashboardData()
    } catch (error) {
      console.error('Error starting consultation:', error)
      alert('Failed to start consultation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompleteConsultation = async (appointmentId: string) => {
    setActionLoading(appointmentId)
    try {
      const { error } = await client
        .from('appointments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error
      await fetchDashboardData()
    } catch (error) {
      console.error('Error completing consultation:', error)
      alert('Failed to complete consultation')
    } finally {
      setActionLoading(null)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'checked_in':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )
      case 'approved':
        return (
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getActivityText = (activity: RecentActivity): string => {
    switch (activity.type) {
      case 'completed':
        return `Completed consultation with ${activity.patientName}`
      case 'checked_in':
        return `${activity.patientName} checked in`
      case 'approved':
        return `Approved appointment for ${activity.patientName}`
      default:
        return `New booking from ${activity.patientName}`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">
            {getGreeting()}{hospital ? `, ${hospital.name}` : ''}!
          </h1>
          <p className="text-body text-gray-600">
            {new Date().toLocaleDateString('en-GH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/provider/schedule">
            <Button variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Manage Schedule
            </Button>
          </Link>
          <Link href="/provider/appointments">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Appointments
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Today&apos;s Appointments</p>
                <p className="text-h2 text-gray-900">{todayStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Completed</p>
                <p className="text-h2 text-gray-900">{todayStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Pending Approval</p>
                <p className="text-h2 text-gray-900">{todayStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">No Shows</p>
                <p className="text-h2 text-gray-900">{todayStats.noShows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {todayStats.pending > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-label text-warning-700">
              You have {todayStats.pending} appointment{todayStats.pending > 1 ? 's' : ''} pending approval
            </p>
            <p className="text-body-sm text-warning-600">
              Please review and respond to these requests
            </p>
          </div>
          <Link href="/provider/appointments">
            <Button variant="outline" size="sm">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* Patient Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patient Queue</CardTitle>
          <Link href="/provider/appointments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-body text-gray-600">No patients in queue</p>
              <p className="text-body-sm text-gray-500">Confirmed appointments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Patient</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Department</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Wait Time</th>
                    <th className="text-right py-3 px-4 text-label text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((apt, index) => {
                    const colors = statusColors[apt.status] || statusColors.confirmed
                    const patientName = apt.patient?.users?.full_name || 'Unknown Patient'
                    const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase()

                    return (
                      <tr
                        key={apt.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-body text-gray-600">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-body-sm font-medium text-gray-600">
                              {initials}
                            </div>
                            <div>
                              <span className="text-label text-gray-900 block">{patientName}</span>
                              <span className="text-body-sm text-gray-500">{apt.reference_number}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-body text-gray-600">{apt.start_time}</td>
                        <td className="py-4 px-4 text-body text-gray-600">{apt.department?.name || 'General'}</td>
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', colors.bg, colors.text)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                            {apt.status === 'checked_in' ? 'Checked In' :
                             apt.status === 'confirmed' ? 'Confirmed' :
                             apt.status === 'in_progress' ? 'In Progress' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-body text-gray-600">
                          {calculateWaitTime(apt.checked_in_at, apt.start_time)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {apt.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(apt.id)}
                              disabled={actionLoading === apt.id}
                            >
                              {actionLoading === apt.id ? 'Processing...' : 'Check In'}
                            </Button>
                          )}
                          {apt.status === 'checked_in' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartConsultation(apt.id)}
                              disabled={actionLoading === apt.id}
                            >
                              {actionLoading === apt.id ? 'Processing...' : 'Start'}
                            </Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => handleCompleteConsultation(apt.id)}
                              disabled={actionLoading === apt.id}
                            >
                              {actionLoading === apt.id ? 'Processing...' : 'Complete'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link href="/provider/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Patient</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Department</th>
                    <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((apt) => {
                    const patientName = apt.patient?.users?.full_name || 'Unknown Patient'
                    const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase()
                    const statusColor = apt.status === 'confirmed'
                      ? { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
                      : { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }

                    return (
                      <tr
                        key={apt.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-body-sm font-medium text-gray-600">
                              {initials}
                            </div>
                            <div>
                              <span className="text-label text-gray-900 block">{patientName}</span>
                              <span className="text-body-sm text-gray-500">{apt.reference_number}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-body text-gray-600">
                          {new Date(apt.appointment_date).toLocaleDateString('en-GH', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 text-body text-gray-600">{apt.start_time}</td>
                        <td className="py-4 px-4 text-body text-gray-600">{apt.department?.name || 'General'}</td>
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusColor.bg, statusColor.text)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusColor.dot)} />
                            {apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Schedule Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-body text-gray-600">Confirmed</span>
                <Badge variant="success">{todayStats.confirmed} appointments</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: todayStats.total > 0 ? `${(todayStats.confirmed / todayStats.total) * 100}%` : '0%' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-body text-gray-600">Completed</span>
                <Badge variant="info">{todayStats.completed} appointments</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: todayStats.total > 0 ? `${(todayStats.completed / todayStats.total) * 100}%` : '0%' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-body text-gray-600">Checked In / In Progress</span>
                <Badge variant="warning">{todayStats.checkedIn} patients</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: todayStats.total > 0 ? `${(todayStats.checkedIn / todayStats.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-body text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-body-sm text-gray-900">{getActivityText(activity)}</p>
                      <p className="text-body-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
