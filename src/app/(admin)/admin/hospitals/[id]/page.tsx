'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteHospital, reactivateHospital } from '@/lib/admin/actions'
import type { Hospital as HospitalType, Department as DepartmentType } from '@/types/database'

// Ghana regions
const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
]

type Hospital = HospitalType
type Department = DepartmentType

export default function EditHospitalPage() {
  const params = useParams()
  const router = useRouter()
  const hospitalId = params.id as string

  const [hospital, setHospital] = React.useState<Hospital | null>(null)
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    city: '',
    region: '',
    phone: '',
    email: '',
    website: '',
    type: 'public' as 'public' | 'private',
    description: '',
  })

  const supabase = createClient()
  // eslint-disable-next-line
  const client = supabase as any

  // Fetch hospital data
  React.useEffect(() => {
    async function fetchHospital() {
      try {
        const { data, error: hospitalError } = await client
          .from('hospitals')
          .select('*')
          .eq('id', hospitalId)
          .single()

        if (hospitalError || !data) {
          setError('Hospital not found')
          setIsLoading(false)
          return
        }

        const hospitalData = data as Hospital
        setHospital(hospitalData)
        setFormData({
          name: hospitalData.name || '',
          address: hospitalData.address || '',
          city: hospitalData.city || '',
          region: hospitalData.region || '',
          phone: hospitalData.phone || '',
          email: hospitalData.email || '',
          website: hospitalData.website || '',
          type: hospitalData.type || 'public',
          description: hospitalData.description || '',
        })

        // Fetch departments
        const { data: deptData } = await client
          .from('departments')
          .select('*')
          .eq('hospital_id', hospitalId)
          .order('name')

        if (deptData) {
          setDepartments(deptData as Department[])
        }
      } catch (err) {
        console.error('Error fetching hospital:', err)
        setError('Failed to load hospital data')
      } finally {
        setIsLoading(false)
      }
    }

    if (hospitalId) {
      fetchHospital()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await client
        .from('hospitals')
        .update({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          type: formData.type,
          description: formData.description || null,
        })
        .eq('id', hospitalId)

      if (updateError) {
        throw updateError
      }

      setSuccess('Hospital updated successfully!')

      // Update local state
      setHospital(prev => prev ? { ...prev, ...formData } : null)
    } catch (err) {
      console.error('Error updating hospital:', err)
      setError('Failed to update hospital')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this hospital?')) return

    const result = await deleteHospital(hospitalId)
    if (result.success) {
      setHospital(prev => prev ? { ...prev, is_active: false } : null)
      setSuccess('Hospital deactivated')
    } else {
      setError(result.error || 'Failed to deactivate hospital')
    }
  }

  const handleReactivate = async () => {
    const result = await reactivateHospital(hospitalId)
    if (result.success) {
      setHospital(prev => prev ? { ...prev, is_active: true } : null)
      setSuccess('Hospital reactivated')
    } else {
      setError(result.error || 'Failed to reactivate hospital')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">Hospital Not Found</h3>
            <p className="text-body text-gray-600 mb-4">
              The hospital you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/admin/hospitals">
              <Button>Back to Hospitals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/hospitals" className="inline-flex items-center text-body-sm text-gray-600 hover:text-primary mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hospitals
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-gray-900">Edit Hospital</h1>
          <Badge variant={hospital.is_active ? 'success' : 'secondary'}>
            {hospital.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-body text-gray-600">
          Update hospital information and settings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-body-sm text-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-body-sm text-success">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-label text-gray-700 mb-1">
                  Hospital Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-label text-gray-700 mb-1">
                  Type <span className="text-error">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label htmlFor="region" className="block text-label text-gray-700 mb-1">
                  Region <span className="text-error">*</span>
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Select a region</option>
                  {GHANA_REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-label text-gray-700 mb-1">
                  City <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-label text-gray-700 mb-1">
                  Address <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-label text-gray-700 mb-1">
                  Description <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-label text-gray-700 mb-1">
                  Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-label text-gray-700 mb-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="website" className="block text-label text-gray-700 mb-1">
                  Website <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Departments ({departments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <p className="text-body-sm text-gray-500">No departments added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <span
                    key={dept.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {dept.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          {hospital.is_active ? (
            <Button
              type="button"
              variant="outline"
              className="text-error border-error hover:bg-error/10"
              onClick={handleDeactivate}
            >
              Deactivate Hospital
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="text-success border-success hover:bg-success/10"
              onClick={handleReactivate}
            >
              Reactivate Hospital
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
