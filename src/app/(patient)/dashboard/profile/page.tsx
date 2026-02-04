'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserData {
  full_name: string
  email: string
  phone: string | null
}

interface PatientData {
  date_of_birth: string | null
  gender: string | null
  address: string | null
  ghana_card_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

interface NotificationPreferences {
  appointment_reminders: boolean
  email_notifications: boolean
  marketing_updates: boolean
  health_tips: boolean
}

const regions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Volta',
  'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
]

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState('personal')
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [patientData, setPatientData] = React.useState<PatientData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('')
  const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPreferences>({
    appointment_reminders: true,
    email_notifications: true,
    marketing_updates: false,
    health_tips: true,
  })
  const [isSavingNotifications, setIsSavingNotifications] = React.useState(false)
  const [notificationSaved, setNotificationSaved] = React.useState(false)

  const supabase = createClient()

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userProfile } = await supabase
          .from('users')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          setUserData(userProfile as UserData)
        }

        const { data: patient } = await supabase
          .from('patients')
          .select('date_of_birth, gender, address, ghana_card_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
          .eq('user_id', user.id)
          .single()

        if (patient) {
          setPatientData(patient as PatientData)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async () => {
    if (!userData) return
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update users table - use type assertion to bypass RLS type inference
      await (supabase.from('users') as ReturnType<typeof supabase.from>)
        .update({ phone: userData.phone })
        .eq('id', user.id)

      // Update patients table
      if (patientData) {
        await (supabase.from('patients') as ReturnType<typeof supabase.from>)
          .update(patientData)
          .eq('user_id', user.id)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)

    try {
      // Call the API route to delete the user completely
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out the user
      await supabase.auth.signOut()

      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }))
    setIsSavingNotifications(true)
    setNotificationSaved(false)

    // Simulate saving to database (in production, save to user preferences table)
    await new Promise(resolve => setTimeout(resolve, 500))

    setIsSavingNotifications(false)
    setNotificationSaved(true)

    // Hide the saved message after 2 seconds
    setTimeout(() => setNotificationSaved(false), 2000)
  }

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'contact', label: 'Contact Details', icon: '📞' },
    { id: 'medical', label: 'Medical Info', icon: '🏥' },
    { id: 'emergency', label: 'Emergency Contact', icon: '🚨' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="lg:col-span-3 h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  const getInitials = () => {
    if (!userData?.full_name) return 'U'
    return userData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const nameParts = userData?.full_name?.split(' ') || ['', '']
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-h1 text-gray-900">Profile Settings</h1>
        <p className="text-body text-gray-600">Manage your personal information and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="text-center mb-6 pt-4">
                <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-3xl font-bold text-primary">{getInitials()}</span>
                </div>
                <h3 className="text-label text-gray-900">{userData?.full_name || 'Patient'}</h3>
                <p className="text-body-sm text-gray-500">{userData?.email}</p>
                <Badge variant="success" className="mt-2">Verified</Badge>
              </div>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeSection === section.id ? 'bg-primary-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'personal' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Full Name</label>
                    <p className="text-body text-gray-900">{userData?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={patientData?.date_of_birth || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    ) : (
                      <p className="text-body text-gray-900">
                        {patientData?.date_of_birth ? new Date(patientData.date_of_birth).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Gender</label>
                    {isEditing ? (
                      <select
                        value={patientData?.gender || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, gender: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.gender || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'contact' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact Details</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Email Address</label>
                    <p className="text-body text-gray-900">{userData?.email || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={userData?.phone || ''}
                        onChange={(e) => setUserData(prev => prev ? {...prev, phone: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="+233 XX XXX XXXX"
                      />
                    ) : (
                      <p className="text-body text-gray-900">{userData?.phone || 'Not set'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-label text-gray-700 mb-2">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientData?.address || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, address: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Street address"
                      />
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.address || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'medical' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medical Information</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Ghana Card Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientData?.ghana_card_id || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, ghana_card_id: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="GHA-XXXXXXXXX-X"
                      />
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.ghana_card_id || 'Not set'}</p>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-info/10 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-body-sm text-gray-600">Your Ghana Card helps verify your identity at partner hospitals.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'emergency' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Emergency Contact</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Contact Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientData?.emergency_contact_name || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, emergency_contact_name: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.emergency_contact_name || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Relationship</label>
                    {isEditing ? (
                      <select
                        value={patientData?.emergency_contact_relationship || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, emergency_contact_relationship: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      >
                        <option value="">Select relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.emergency_contact_relationship || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={patientData?.emergency_contact_phone || ''}
                        onChange={(e) => setPatientData(prev => prev ? {...prev, emergency_contact_phone: e.target.value} : null)}
                        className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    ) : (
                      <p className="text-body text-gray-900">{patientData?.emergency_contact_phone || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-label text-gray-900">Password</h4>
                      <p className="text-body-sm text-gray-500">Signed in with Google - password managed by Google</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                    >
                      Manage in Google
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-label text-gray-900">Active Sessions</h4>
                      <p className="text-body-sm text-gray-500">You are currently signed in on this device</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
                <div className="p-4 border border-error/20 bg-error/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-label text-error">Delete Account</h4>
                      <p className="text-body-sm text-gray-500">Permanently delete your account and all data</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-error border-error hover:bg-error/10"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notification Preferences</CardTitle>
                {isSavingNotifications && (
                  <span className="text-body-sm text-gray-500">Saving...</span>
                )}
                {notificationSaved && (
                  <span className="text-body-sm text-success flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-label text-gray-900">Appointment Reminders</h4>
                      <p className="text-body-sm text-gray-500">Get SMS reminders before appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.appointment_reminders}
                        onChange={(e) => handleNotificationChange('appointment_reminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-label text-gray-900">Email Notifications</h4>
                      <p className="text-body-sm text-gray-500">Receive appointment confirmations via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.email_notifications}
                        onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-label text-gray-900">Marketing Updates</h4>
                      <p className="text-body-sm text-gray-500">Receive news about new features and hospitals</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.marketing_updates}
                        onChange={(e) => handleNotificationChange('marketing_updates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-label text-gray-900">Health Tips</h4>
                      <p className="text-body-sm text-gray-500">Weekly health tips and reminders</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.health_tips}
                        onChange={(e) => handleNotificationChange('health_tips', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-h3 text-gray-900 mb-2">Delete Account</h3>
              <p className="text-body text-gray-600">
                This action is <strong>permanent</strong> and cannot be undone. All your data, appointments, and profile information will be deleted.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-label text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-error focus:ring-2 focus:ring-error/20 outline-none"
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-error hover:bg-error/90 text-white"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
