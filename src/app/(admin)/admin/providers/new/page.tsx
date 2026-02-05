'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProvider } from '@/lib/admin/actions'

interface Hospital {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  hospital_id: string
}

export default function NewProviderPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [hospitals, setHospitals] = React.useState<Hospital[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = React.useState<Department[]>([])

  // Form state
  const [formData, setFormData] = React.useState({
    email: '',
    fullName: '',
    phone: '',
    hospitalId: '',
    departmentId: '',
    specialization: '',
  })

  // Success state
  const [credentials, setCredentials] = React.useState<{
    email: string
    temporaryPassword: string
  } | null>(null)

  const [error, setError] = React.useState('')

  const supabase = createClient()

  React.useEffect(() => {
    async function fetchData() {
      // Fetch hospitals
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('id, name')
        .order('name')

      if (hospitalsData) {
        setHospitals(hospitalsData)
      }

      // Fetch all departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name, hospital_id')
        .order('name')

      if (departmentsData) {
        setDepartments(departmentsData)
      }
    }

    fetchData()
  }, [supabase])

  // Filter departments when hospital changes
  React.useEffect(() => {
    if (formData.hospitalId) {
      setFilteredDepartments(departments.filter(d => d.hospital_id === formData.hospitalId))
      setFormData(prev => ({ ...prev, departmentId: '' }))
    } else {
      setFilteredDepartments([])
    }
  }, [formData.hospitalId, departments])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await createProvider(formData)

      if (result.success && result.credentials) {
        setCredentials(result.credentials)
      } else {
        setError(result.error || 'Failed to create provider')
      }
    } catch (err) {
      console.error('Error creating provider:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Success screen with credentials
  if (credentials) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-h2 text-gray-900 mb-2">Provider Created Successfully!</h2>
              <p className="text-body text-gray-600">
                Share these credentials with the new provider securely.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
              <div>
                <label className="block text-label text-gray-500 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-200 text-body">
                    {credentials.email}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.email)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-label text-gray-500 mb-1">Temporary Password</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-200 text-body font-mono">
                    {credentials.temporaryPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.temporaryPassword)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(`Email: ${credentials.email}\nTemporary Password: ${credentials.temporaryPassword}`)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy All Credentials
                </Button>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
              <p className="text-body-sm text-warning-700">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <strong>Important:</strong> Share these credentials securely. The provider should change their password after first login.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/providers" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Providers
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setCredentials(null)
                  setFormData({
                    email: '',
                    fullName: '',
                    phone: '',
                    hospitalId: '',
                    departmentId: '',
                    specialization: '',
                  })
                }}
              >
                Onboard Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/providers" className="inline-flex items-center text-body-sm text-gray-600 hover:text-primary mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Providers
        </Link>
        <h1 className="text-h1 text-gray-900">Onboard New Provider</h1>
        <p className="text-body text-gray-600">
          Create an account for a hospital staff member to access the provider portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-body-sm text-error">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-label text-gray-700 border-b pb-2">Personal Information</h3>

              <div>
                <label htmlFor="fullName" className="block text-label text-gray-700 mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Dr. Kwame Asante"
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
                  placeholder="provider@hospital.com"
                />
              </div>

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
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
            </div>

            {/* Hospital Assignment */}
            <div className="space-y-4">
              <h3 className="text-label text-gray-700 border-b pb-2">Hospital Assignment</h3>

              <div>
                <label htmlFor="hospitalId" className="block text-label text-gray-700 mb-1">
                  Hospital <span className="text-error">*</span>
                </label>
                <select
                  id="hospitalId"
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
                  required
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Select a hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="departmentId" className="block text-label text-gray-700 mb-1">
                  Department <span className="text-error">*</span>
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  disabled={!formData.hospitalId}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.hospitalId ? 'Select a department' : 'Select a hospital first'}
                  </option>
                  {filteredDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="specialization" className="block text-label text-gray-700 mb-1">
                  Specialization <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="e.g., Cardiology, Pediatrics"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Provider...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Provider Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
