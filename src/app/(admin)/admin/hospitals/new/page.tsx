'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

// Common department types
const DEPARTMENT_TYPES = [
  'General Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Surgery',
  'Orthopedics',
  'Cardiology',
  'Dermatology',
  'ENT (Ear, Nose, Throat)',
  'Ophthalmology',
  'Dental',
  'Psychiatry',
  'Emergency',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Physiotherapy',
]

export default function NewHospitalPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // Form state
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

  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([])

  // Success state
  const [credentials, setCredentials] = React.useState<{
    email: string
    temporaryPassword: string
  } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDepartmentToggle = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          departments: selectedDepartments,
        }),
      })

      const result = await response.json()

      if (result.success && result.credentials) {
        setCredentials(result.credentials)
      } else {
        setError(result.error || 'Failed to create hospital')
      }
    } catch (err) {
      console.error('Error creating hospital:', err)
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
              <h2 className="text-h2 text-gray-900 mb-2">Hospital Onboarded Successfully!</h2>
              <p className="text-body text-gray-600">
                Share these login credentials with the hospital administrator securely.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
              <div>
                <label className="block text-label text-gray-500 mb-1">Login Email</label>
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
                  onClick={() => copyToClipboard(
                    `Hospital Portal Login Credentials\n\nEmail: ${credentials.email}\nTemporary Password: ${credentials.temporaryPassword}\n\nPlease change your password after first login.`
                  )}
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
                <strong>Important:</strong> Share these credentials securely. The hospital should change their password after first login. They can then set up their departments and onboard their doctors.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/hospitals" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Hospitals
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setCredentials(null)
                  setFormData({
                    name: '',
                    address: '',
                    city: '',
                    region: '',
                    phone: '',
                    email: '',
                    website: '',
                    type: 'public',
                    description: '',
                  })
                  setSelectedDepartments([])
                }}
              >
                Onboard Another Hospital
              </Button>
            </div>
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
        <h1 className="text-h1 text-gray-900">Onboard New Hospital</h1>
        <p className="text-body text-gray-600">
          Register a healthcare provider and create their admin account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-body-sm text-error">{error}</p>
          </div>
        )}

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
                  placeholder="e.g., Korle Bu Teaching Hospital"
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
                  placeholder="e.g., Accra"
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
                  placeholder="Street address"
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
                  placeholder="Brief description of the hospital..."
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
                  placeholder="+233 XX XXX XXXX"
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
                  placeholder="admin@hospital.com"
                />
                <p className="text-body-sm text-gray-500 mt-1">
                  This will be used as the hospital&apos;s login email
                </p>
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
                  placeholder="https://www.hospital.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <p className="text-body-sm text-gray-500">
              Select the departments this hospital offers. The hospital can add more later.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DEPARTMENT_TYPES.map((dept) => (
                <label
                  key={dept}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDepartments.includes(dept)
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept)}
                    onChange={() => handleDepartmentToggle(dept)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-body-sm text-gray-700">{dept}</span>
                </label>
              ))}
            </div>
            {selectedDepartments.length > 0 && (
              <p className="text-body-sm text-gray-500 mt-4">
                {selectedDepartments.length} department{selectedDepartments.length > 1 ? 's' : ''} selected
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/admin/hospitals" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Hospital...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Onboard Hospital
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
