'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Patient {
  id: string
  user_id: string
  ghana_card_id: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  users: {
    full_name: string
    email: string | null
    phone: string | null
  }
  appointment_count: number
  last_visit: string | null
}

interface PatientAppointment {
  id: string
  appointment_date: string
  start_time: string
  status: string
  reason: string | null
  department: { name: string } | null
}

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
  const [patientHistory, setPatientHistory] = React.useState<PatientAppointment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [hospitalId, setHospitalId] = React.useState<string | null>(null)

  const supabase = createClient()
  // eslint-disable-next-line
  const client = supabase as any

  const fetchPatients = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get hospital ID
      let hId: string | null = null

      const { data: provider } = await client
        .from('providers')
        .select('hospital_id')
        .eq('user_id', user.id)
        .single()

      if (provider) {
        hId = provider.hospital_id
      } else {
        const { data: hospitalByEmail } = await client
          .from('hospitals')
          .select('id')
          .eq('email', user.email)
          .single()

        if (hospitalByEmail) {
          hId = hospitalByEmail.id
        }
      }

      if (!hId) {
        setIsLoading(false)
        return
      }

      setHospitalId(hId)

      // Get all unique patients who have appointments at this hospital
      const { data: appointmentData } = await client
        .from('appointments')
        .select(`
          patient_id,
          patients!inner(
            id,
            user_id,
            ghana_card_id,
            date_of_birth,
            gender,
            address,
            emergency_contact_name,
            emergency_contact_phone,
            users(full_name, email, phone)
          )
        `)
        .eq('hospital_id', hId)
        .order('created_at', { ascending: false })

      if (appointmentData) {
        // Get unique patients with their appointment stats
        const patientMap = new Map<string, Patient>()

        for (const apt of appointmentData) {
          const p = apt.patients
          if (p && !patientMap.has(p.id)) {
            // Count appointments for this patient at this hospital
            const { count } = await client
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('hospital_id', hId)
              .eq('patient_id', p.id)

            // Get last visit
            const { data: lastVisit } = await client
              .from('appointments')
              .select('appointment_date')
              .eq('hospital_id', hId)
              .eq('patient_id', p.id)
              .eq('status', 'completed')
              .order('appointment_date', { ascending: false })
              .limit(1)
              .single()

            patientMap.set(p.id, {
              ...p,
              appointment_count: count || 0,
              last_visit: lastVisit?.appointment_date || null,
            })
          }
        }

        setPatients(Array.from(patientMap.values()))
      }

    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const fetchPatientHistory = async (patient: Patient) => {
    if (!hospitalId) return

    setLoadingHistory(true)
    setSelectedPatient(patient)

    try {
      const { data } = await client
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          reason,
          department:departments(name)
        `)
        .eq('hospital_id', hospitalId)
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: false })
        .limit(10)

      if (data) {
        setPatientHistory(data)
      }
    } catch (error) {
      console.error('Error fetching patient history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const filteredPatients = patients.filter(p => {
    const searchLower = searchQuery.toLowerCase()
    return (
      p.users.full_name.toLowerCase().includes(searchLower) ||
      (p.users.phone || '').includes(searchQuery) ||
      (p.users.email || '').toLowerCase().includes(searchLower) ||
      (p.ghana_card_id || '').toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateAge = (dob: string | null): string => {
    if (!dob) return 'N/A'
    const birth = new Date(dob)
    const now = new Date()
    const age = now.getFullYear() - birth.getFullYear()
    return `${age} years`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'success',
      confirmed: 'info',
      pending: 'warning',
      cancelled: 'secondary',
      rejected: 'error',
      no_show: 'error',
    }
    return colors[status] || 'secondary'
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="h-12 bg-gray-200 rounded w-full" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between border-b">
              <div>
                <CardTitle>{selectedPatient.users.full_name}</CardTitle>
                <p className="text-body-sm text-gray-500 mt-1">
                  Patient ID: {selectedPatient.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null)
                  setPatientHistory([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              {/* Patient Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="text-label text-gray-900 font-medium">Contact Information</h4>
                  <div className="space-y-2 text-body-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-900">{selectedPatient.users.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-900">{selectedPatient.users.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address</span>
                      <span className="text-gray-900 text-right max-w-[200px]">{selectedPatient.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-label text-gray-900 font-medium">Personal Details</h4>
                  <div className="space-y-2 text-body-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ghana Card</span>
                      <span className="text-gray-900">{selectedPatient.ghana_card_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="text-gray-900">{formatDate(selectedPatient.date_of_birth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age</span>
                      <span className="text-gray-900">{calculateAge(selectedPatient.date_of_birth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender</span>
                      <span className="text-gray-900 capitalize">{selectedPatient.gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(selectedPatient.emergency_contact_name || selectedPatient.emergency_contact_phone) && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="text-label text-red-800 font-medium mb-2">Emergency Contact</h4>
                  <div className="space-y-1 text-body-sm">
                    <p className="text-red-900">{selectedPatient.emergency_contact_name || 'N/A'}</p>
                    <p className="text-red-700">{selectedPatient.emergency_contact_phone || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Appointment History */}
              <div>
                <h4 className="text-label text-gray-900 font-medium mb-3">Appointment History</h4>
                {loadingHistory ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : patientHistory.length === 0 ? (
                  <p className="text-body-sm text-gray-500 text-center py-4">No appointment history</p>
                ) : (
                  <div className="space-y-2">
                    {patientHistory.map(apt => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-body-sm text-gray-900">
                            {formatDate(apt.appointment_date)} at {apt.start_time}
                          </p>
                          <p className="text-body-sm text-gray-500">
                            {apt.department?.name || 'General'} {apt.reason ? `- ${apt.reason}` : ''}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(apt.status) as 'success' | 'info' | 'warning' | 'error' | 'secondary'}>
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-h1 text-gray-900">Patient Records</h1>
        <p className="text-body text-gray-600">
          View and manage patients who have visited your hospital
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Total Patients</p>
                <p className="text-h3 text-gray-900">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">With Complete Info</p>
                <p className="text-h3 text-gray-900">
                  {patients.filter(p => p.ghana_card_id && p.date_of_birth).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">Repeat Visitors</p>
                <p className="text-h3 text-gray-900">
                  {patients.filter(p => p.appointment_count > 1).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-gray-500">New This Month</p>
                <p className="text-h3 text-gray-900">
                  {patients.filter(p => {
                    if (!p.last_visit) return false
                    const visitDate = new Date(p.last_visit)
                    const now = new Date()
                    return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, phone, email, or Ghana Card ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-body text-gray-600">
              {searchQuery
                ? 'Try a different search term'
                : 'Patients will appear here after their first appointment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map(patient => {
            const initials = patient.users.full_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card
                key={patient.id}
                className="hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => fetchPatientHistory(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-label text-gray-900 truncate">
                          {patient.users.full_name}
                        </h3>
                        {patient.appointment_count > 3 && (
                          <Badge variant="info">Regular</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-gray-500">
                        {patient.users.phone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {patient.users.phone}
                          </span>
                        )}
                        {patient.gender && (
                          <span className="capitalize">{patient.gender}</span>
                        )}
                        {patient.date_of_birth && (
                          <span>{calculateAge(patient.date_of_birth)}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-center">
                      <div>
                        <p className="text-h3 text-gray-900">{patient.appointment_count}</p>
                        <p className="text-body-sm text-gray-500">Visits</p>
                      </div>
                      <div>
                        <p className="text-body-sm text-gray-900">
                          {patient.last_visit ? formatDate(patient.last_visit) : 'Never'}
                        </p>
                        <p className="text-body-sm text-gray-500">Last Visit</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
