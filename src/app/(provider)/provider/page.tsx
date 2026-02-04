'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock data
const todayStats = {
  total: 12,
  completed: 5,
  remaining: 7,
  noShows: 0,
}

const patientQueue = [
  {
    id: '1',
    name: 'Ama Serwaa',
    time: '09:00',
    status: 'checked_in' as const,
    reason: 'Follow-up consultation',
    waitTime: '10 mins',
  },
  {
    id: '2',
    name: 'Kofi Asante',
    time: '09:30',
    status: 'waiting' as const,
    reason: 'Headache and fever',
    waitTime: '5 mins',
  },
  {
    id: '3',
    name: 'Abena Mensah',
    time: '10:00',
    status: 'scheduled' as const,
    reason: 'General checkup',
    waitTime: '-',
  },
  {
    id: '4',
    name: 'Kwesi Appiah',
    time: '10:30',
    status: 'scheduled' as const,
    reason: 'Skin rash',
    waitTime: '-',
  },
  {
    id: '5',
    name: 'Efua Darko',
    time: '11:00',
    status: 'scheduled' as const,
    reason: 'Blood pressure check',
    waitTime: '-',
  },
]

const statusColors = {
  checked_in: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  waiting: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
}

export default function ProviderDashboard() {
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">{getGreeting()}, Dr. Mensah!</h1>
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
          <Button variant="outline">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Schedule
          </Button>
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Block Time
          </Button>
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
                <p className="text-body-sm text-gray-500">Total Appointments</p>
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
                <p className="text-body-sm text-gray-500">Remaining</p>
                <p className="text-h2 text-gray-900">{todayStats.remaining}</p>
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

      {/* Patient Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patient Queue</CardTitle>
          <Link href="/provider/patients">
            <Button variant="ghost" size="sm">View All →</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Reason</th>
                  <th className="text-left py-3 px-4 text-label text-gray-500 font-medium">Wait Time</th>
                  <th className="text-right py-3 px-4 text-label text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {patientQueue.map((patient, index) => {
                  const colors = statusColors[patient.status]

                  return (
                    <tr
                      key={patient.id}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                        selectedPatient === patient.id && 'bg-primary-50'
                      )}
                    >
                      <td className="py-4 px-4 text-body text-gray-600">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-body-sm font-medium text-gray-600">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-label text-gray-900">{patient.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-body text-gray-600">{patient.time}</td>
                      <td className="py-4 px-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', colors.bg, colors.text)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                          {patient.status === 'checked_in' ? 'Checked In' :
                           patient.status === 'waiting' ? 'Waiting' :
                           patient.status === 'scheduled' ? 'Scheduled' :
                           'In Progress'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-body-sm text-gray-600 max-w-xs truncate">
                        {patient.reason}
                      </td>
                      <td className="py-4 px-4 text-body text-gray-600">{patient.waitTime}</td>
                      <td className="py-4 px-4 text-right">
                        {patient.status === 'checked_in' ? (
                          <Button size="sm">Start Consultation</Button>
                        ) : patient.status === 'waiting' ? (
                          <Button size="sm" variant="outline">Check In</Button>
                        ) : (
                          <Button size="sm" variant="ghost">Check In</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-body text-gray-600">Morning (8:00 - 12:00)</span>
                <Badge variant="default">6 appointments</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-body text-gray-600">Afternoon (14:00 - 17:00)</span>
                <Badge variant="info">6 appointments</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-info h-2 rounded-full" style={{ width: '0%' }} />
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
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm text-gray-900">Completed consultation with Yaa Asantewaa</p>
                  <p className="text-body-sm text-gray-500">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm text-gray-900">Ama Serwaa checked in</p>
                  <p className="text-body-sm text-gray-500">25 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-body-sm text-gray-900">Completed consultation with Kwame Boateng</p>
                  <p className="text-body-sm text-gray-500">45 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
