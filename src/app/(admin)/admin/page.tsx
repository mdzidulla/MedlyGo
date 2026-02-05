'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  totalPatients: number
  totalHospitals: number
  activeHospitals: number
  totalAppointments: number
  todayAppointments: number
  pendingAppointments: number
}

interface RecentAppointment {
  id: string
  created_at: string
  status: string
  patient: { full_name: string } | null
  hospital: { name: string } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalPatients: 0,
    totalHospitals: 0,
    activeHospitals: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
  })
  const [recentAppointments, setRecentAppointments] = React.useState<RecentAppointment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const supabase = createClient()

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch all stats in parallel
      const [
        { count: totalPatients },
        { count: totalHospitals },
        { count: activeHospitals },
        { count: totalAppointments },
        { count: todayAppointments },
        { count: pendingAppointments },
        { data: recentAppts },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('appointments')
          .select(`
            id,
            created_at,
            status,
            patient:patients(full_name),
            hospital:hospitals(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        totalPatients: totalPatients || 0,
        totalHospitals: totalHospitals || 0,
        activeHospitals: activeHospitals || 0,
        totalAppointments: totalAppointments || 0,
        todayAppointments: todayAppointments || 0,
        pendingAppointments: pendingAppointments || 0,
      })

      if (recentAppts) {
        setRecentAppointments(recentAppts as unknown as RecentAppointment[])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchDashboardData()

    // Set up real-time subscription for appointments
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospitals' },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDashboardData, supabase])

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">Admin Dashboard</h1>
          <p className="text-body text-gray-600">
            Real-time overview of your platform
          </p>
        </div>
        <Link href="/admin/hospitals/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Onboard Hospital
          </Button>
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Total Patients</p>
                <p className="text-h2 text-gray-900">{stats.totalPatients.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Hospitals</p>
                <p className="text-h2 text-gray-900">
                  {stats.activeHospitals}
                  <span className="text-body-sm text-gray-400 ml-1">/ {stats.totalHospitals}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Total Appointments</p>
                <p className="text-h2 text-gray-900">{stats.totalAppointments.toLocaleString()}</p>
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
                <p className="text-h2 text-gray-900">{stats.pendingAppointments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Stats */}
      <Card className="bg-gradient-to-r from-primary to-primary-600">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-white">
              <p className="text-body opacity-80">Today&apos;s Appointments</p>
              <p className="text-4xl font-bold">{stats.todayAppointments}</p>
              <p className="text-body-sm opacity-70 mt-1">
                {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <Link href="/admin/appointments">
              <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
                View All Appointments
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/hospitals/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label text-gray-900">Onboard New Hospital</p>
                    <p className="text-body-sm text-gray-500">Add a healthcare provider</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/hospitals" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label text-gray-900">Manage Hospitals</p>
                    <p className="text-body-sm text-gray-500">View and edit hospital details</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/patients" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-label text-gray-900">View Patients</p>
                    <p className="text-body-sm text-gray-500">Browse all registered patients</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Appointments</CardTitle>
            <Link href="/admin/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-body-sm text-gray-500">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body-sm text-gray-900 truncate">
                          {apt.patient?.full_name || 'Unknown Patient'}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-body-sm text-gray-500 truncate">
                        {apt.hospital?.name || 'Unknown Hospital'}
                      </p>
                      <p className="text-body-sm text-gray-400">{formatTimeAgo(apt.created_at)}</p>
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
