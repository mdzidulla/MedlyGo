'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [user, setUser] = React.useState<{ email: string; full_name: string } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const supabase = createClient()

  React.useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single()

        if (data) {
          setUser(data)
        }
      }
      setIsLoading(false)
    }

    fetchUser()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-gray-900">Settings</h1>
        <p className="text-body text-gray-600">
          Manage your admin account settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary font-semibold text-2xl">
                {user?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <h3 className="text-label text-gray-900">{user?.full_name || 'Admin User'}</h3>
              <p className="text-body-sm text-gray-600">{user?.email}</p>
              <p className="text-body-sm text-primary">Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-body-sm text-gray-600">
              Platform configuration options will be available here in future updates. This includes:
            </p>
            <ul className="mt-2 text-body-sm text-gray-500 list-disc list-inside">
              <li>Default appointment settings</li>
              <li>Email notification templates</li>
              <li>System maintenance controls</li>
              <li>Backup and data export options</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-label text-gray-900">Change Password</h4>
              <p className="text-body-sm text-gray-500">Update your account password</p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <h4 className="text-label text-gray-900">Two-Factor Authentication</h4>
              <p className="text-body-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/20">
        <CardHeader>
          <CardTitle className="text-error">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-label text-gray-900">Export All Data</h4>
              <p className="text-body-sm text-gray-500">Download all platform data as CSV</p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
