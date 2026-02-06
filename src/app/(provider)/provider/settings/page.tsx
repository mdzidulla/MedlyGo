'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface HospitalSettings {
  id: string
  name: string
  address: string
  city: string
  region: string
  phone: string | null
  email: string | null
  website: string | null
  type: 'public' | 'private'
  description: string | null
  is_24_hours: boolean
  opening_time: string | null
  closing_time: string | null
}

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

export default function SettingsPage() {
  const [hospital, setHospital] = React.useState<HospitalSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [success, setSuccess] = React.useState('')
  const [error, setError] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'profile' | 'hours' | 'password'>('profile')

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

  // Hours form state
  const [hoursData, setHoursData] = React.useState({
    is_24_hours: false,
    opening_time: '08:00',
    closing_time: '17:00',
  })

  // Password form state
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const supabase = createClient()
  // eslint-disable-next-line
  const client = supabase as any

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get hospital ID
        let hospitalId: string | null = null

        const { data: provider } = await client
          .from('providers')
          .select('hospital_id')
          .eq('user_id', user.id)
          .single()

        if (provider) {
          hospitalId = provider.hospital_id
        } else {
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
          setIsLoading(false)
          return
        }

        // Fetch hospital settings
        const { data: hospitalData } = await client
          .from('hospitals')
          .select('*')
          .eq('id', hospitalId)
          .single()

        if (hospitalData) {
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
          setHoursData({
            is_24_hours: hospitalData.is_24_hours || false,
            opening_time: hospitalData.opening_time || '08:00',
            closing_time: hospitalData.closing_time || '17:00',
          })
        }

      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveProfile = async () => {
    if (!hospital) return

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
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          type: formData.type,
          description: formData.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hospital.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
      setHospital(prev => prev ? { ...prev, ...formData } : null)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveHours = async () => {
    if (!hospital) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await client
        .from('hospitals')
        .update({
          is_24_hours: hoursData.is_24_hours,
          opening_time: hoursData.is_24_hours ? null : hoursData.opening_time,
          closing_time: hoursData.is_24_hours ? null : hoursData.closing_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hospital.id)

      if (updateError) throw updateError

      setSuccess('Operating hours updated successfully!')
    } catch (err) {
      console.error('Error updating hours:', err)
      setError('Failed to update operating hours')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      console.error('Error changing password:', err)
      setError('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const tabs = [
    { key: 'profile', label: 'Hospital Profile' },
    { key: 'hours', label: 'Operating Hours' },
    { key: 'password', label: 'Change Password' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-gray-900">Settings</h1>
        <p className="text-body text-gray-600">
          Manage your hospital profile and account settings
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setSuccess('')
              setError('')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Hospital Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label text-gray-700 mb-2">Hospital Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'public' | 'private' }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="public">Public Hospital</option>
                  <option value="private">Private Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">Region *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                >
                  <option value="">Select Region</option>
                  {GHANA_REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-label text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="+233..."
                />
              </div>

              <div>
                <label className="block text-label text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-label text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="https://"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-label text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Brief description of your hospital..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_24_hours"
                checked={hoursData.is_24_hours}
                onChange={(e) => setHoursData(prev => ({ ...prev, is_24_hours: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300"
              />
              <label htmlFor="is_24_hours" className="text-body text-gray-700">
                This hospital operates 24 hours
              </label>
              {hoursData.is_24_hours && (
                <Badge variant="success" className="ml-auto">24/7</Badge>
              )}
            </div>

            {!hoursData.is_24_hours && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label text-gray-700 mb-2">Opening Time</label>
                  <input
                    type="time"
                    value={hoursData.opening_time}
                    onChange={(e) => setHoursData(prev => ({ ...prev, opening_time: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-label text-gray-700 mb-2">Closing Time</label>
                  <input
                    type="time"
                    value={hoursData.closing_time}
                    onChange={(e) => setHoursData(prev => ({ ...prev, closing_time: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-body-sm text-blue-700">
                <strong>Note:</strong> These are your general operating hours. You can set more specific schedules per day in the Schedule page.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveHours} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Hours'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 max-w-md">
            <div>
              <label className="block text-label text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-label text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-body-sm text-yellow-700">
                <strong>Password requirements:</strong>
              </p>
              <ul className="text-body-sm text-yellow-600 mt-2 space-y-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={isSaving || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
