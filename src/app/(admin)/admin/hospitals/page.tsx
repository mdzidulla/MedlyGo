'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteHospital, reactivateHospital } from '@/lib/admin/actions'

interface Hospital {
  id: string
  name: string
  address: string
  city: string
  region: string
  phone: string
  email: string
  website: string | null
  type: 'public' | 'private'
  is_active: boolean
  created_at: string
  departments: { id: string; name: string }[]
}

type FilterType = 'all' | 'active' | 'inactive'

export default function HospitalsPage() {
  const [hospitals, setHospitals] = React.useState<Hospital[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const supabase = createClient()

  const fetchHospitals = React.useCallback(async () => {
    try {
      // First fetch hospitals
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('hospitals')
        .select(`
          id,
          name,
          address,
          city,
          region,
          phone,
          email,
          website,
          type,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false }) as {
          data: Omit<Hospital, 'departments'>[] | null
          error: any
        }

      if (hospitalsError) {
        console.error('Error fetching hospitals:', hospitalsError)
        setIsLoading(false)
        return
      }

      if (!hospitalsData || hospitalsData.length === 0) {
        setHospitals([])
        setIsLoading(false)
        return
      }

      // Fetch departments for each hospital
      const hospitalIds = hospitalsData.map(h => h.id)
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name, hospital_id')
        .in('hospital_id', hospitalIds) as {
          data: { id: string; name: string; hospital_id: string }[] | null
        }

      // Map departments to hospitals
      const hospitalsWithDepts: Hospital[] = hospitalsData.map(hospital => ({
        ...hospital,
        departments: departmentsData?.filter(d => d.hospital_id === hospital.id).map(d => ({ id: d.id, name: d.name })) || []
      }))

      setHospitals(hospitalsWithDepts)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  const handleDeactivate = async (hospitalId: string) => {
    if (!confirm('Are you sure you want to deactivate this hospital? This will also deactivate all associated provider accounts.')) return

    setActionLoading(hospitalId)
    try {
      const result = await deleteHospital(hospitalId)
      if (result.success) {
        await fetchHospitals()
      } else {
        alert(result.error || 'Failed to deactivate hospital')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (hospitalId: string) => {
    setActionLoading(hospitalId)
    try {
      const result = await reactivateHospital(hospitalId)
      if (result.success) {
        await fetchHospitals()
      } else {
        alert(result.error || 'Failed to reactivate hospital')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredHospitals = hospitals.filter((hospital) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchLower) ||
      hospital.city.toLowerCase().includes(searchLower) ||
      hospital.region.toLowerCase().includes(searchLower) ||
      hospital.email.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    switch (filter) {
      case 'active':
        return hospital.is_active
      case 'inactive':
        return !hospital.is_active
      default:
        return true
    }
  })

  const counts = {
    all: hospitals.length,
    active: hospitals.filter(h => h.is_active).length,
    inactive: hospitals.filter(h => !h.is_active).length,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded w-40" />
        </div>
        <div className="h-12 bg-gray-200 rounded" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">Hospitals</h1>
          <p className="text-body text-gray-600">
            Manage healthcare providers on the platform
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

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search hospitals by name, city, region, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as FilterType[]).map((f) => (
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

      {/* Hospitals List */}
      {filteredHospitals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {searchQuery ? 'No hospitals found' : 'No hospitals yet'}
            </h3>
            <p className="text-body text-gray-600 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by onboarding your first hospital'}
            </p>
            {!searchQuery && (
              <Link href="/admin/hospitals/new">
                <Button>Onboard First Hospital</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className={`hover:shadow-card-hover transition-shadow ${!hospital.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      hospital.is_active ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-7 h-7 ${hospital.is_active ? 'text-primary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-label text-gray-900">{hospital.name}</h3>
                        <Badge variant={hospital.is_active ? 'success' : 'secondary'}>
                          {hospital.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={hospital.type === 'public' ? 'info' : 'warning'}>
                          {hospital.type}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-gray-600 mb-2">
                        {hospital.address}, {hospital.city}, {hospital.region}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {hospital.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {hospital.email}
                        </span>
                        <span>Added {formatDate(hospital.created_at)}</span>
                      </div>
                      {hospital.departments && hospital.departments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {hospital.departments.slice(0, 5).map((dept) => (
                            <span key={dept.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {dept.name}
                            </span>
                          ))}
                          {hospital.departments.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{hospital.departments.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/admin/hospitals/${hospital.id}`}>
                      <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Button>
                    </Link>
                    {hospital.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error hover:bg-error/10"
                        onClick={() => handleDeactivate(hospital.id)}
                        disabled={actionLoading === hospital.id}
                      >
                        {actionLoading === hospital.id ? 'Processing...' : 'Deactivate'}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleReactivate(hospital.id)}
                        disabled={actionLoading === hospital.id}
                      >
                        {actionLoading === hospital.id ? 'Processing...' : 'Reactivate'}
                      </Button>
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
