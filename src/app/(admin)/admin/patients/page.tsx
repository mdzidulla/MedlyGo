'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Patient {
  id: string
  user_id: string
  date_of_birth: string | null
  gender: string | null
  address: string | null
  ghana_card_id: string | null
  nhis_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  created_at: string
  users: {
    full_name: string
    email: string
    phone: string | null
    role: string
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')

  const supabase = createClient()

  const fetchPatients = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          user_id,
          date_of_birth,
          gender,
          address,
          ghana_card_id,
          nhis_number,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          created_at,
          users!inner(full_name, email, phone, role)
        `)
        .eq('users.role', 'patient')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching patients:', error)
      } else if (data) {
        setPatients(data as unknown as Patient[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase()
    const name = patient.users?.full_name || ''
    const email = patient.users?.email || ''
    const phone = patient.users?.phone || ''

    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
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
        <h1 className="text-h1 text-gray-900">Patients</h1>
        <p className="text-body text-gray-600">
          {patients.length} registered patient{patients.length !== 1 ? 's' : ''} on the platform
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </h3>
            <p className="text-body text-gray-600">
              {searchQuery ? 'Try a different search term' : 'Patients will appear here when they sign up'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-lg">
                      {patient.users?.full_name?.charAt(0) || 'P'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-label text-gray-900">{patient.users?.full_name || 'Unknown'}</h3>
                      {patient.gender && (
                        <Badge variant="secondary">{patient.gender}</Badge>
                      )}
                      {calculateAge(patient.date_of_birth) && (
                        <Badge variant="secondary">{calculateAge(patient.date_of_birth)} yrs</Badge>
                      )}
                      {patient.nhis_number && (
                        <Badge variant="info">NHIS</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-body-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {patient.users?.email}
                      </span>
                      {patient.users?.phone && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {patient.users.phone}
                        </span>
                      )}
                      <span>Joined {formatDate(patient.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {patient.address && (
                      <p className="text-body-sm text-gray-600 max-w-[200px] truncate">
                        {patient.address}
                      </p>
                    )}
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
