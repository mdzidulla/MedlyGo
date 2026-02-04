'use client'

import * as React from 'react'
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

const regions = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Volta',
  'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
]

export default function ProfilePage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState('personal')
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [patientData, setPatientData] = React.useState<PatientData | null>(null)

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
                      <p className="text-body-sm text-gray-500">Signed in with Google</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>Change Password</Button>
                  </div>
                </div>
                <div className="p-4 border border-error/20 bg-error/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-label text-error">Delete Account</h4>
                      <p className="text-body-sm text-gray-500">Permanently delete your account and data</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-error border-error hover:bg-error/10">Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { title: 'Appointment Reminders', desc: 'Get SMS reminders before appointments', defaultChecked: true },
                    { title: 'Email Notifications', desc: 'Receive appointment confirmations via email', defaultChecked: true },
                    { title: 'Marketing Updates', desc: 'Receive news about new features and hospitals', defaultChecked: false },
                    { title: 'Health Tips', desc: 'Weekly health tips and reminders', defaultChecked: true },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 ${i < 3 ? 'border-b border-gray-100' : ''}`}>
                      <div>
                        <h4 className="text-label text-gray-900">{item.title}</h4>
                        <p className="text-body-sm text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
