'use client'

import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deactivateProvider } from '@/lib/admin/actions'

interface Provider {
  id: string
  user_id: string
  specialization: string | null
  is_active: boolean
  created_at: string
  user: {
    full_name: string
    email: string
    phone: string
  } | null
  hospital: {
    name: string
  } | null
  department: {
    name: string
  } | null
}

export default function ProvidersPage() {
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const supabase = createClient()

  const fetchProviders = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id,
          user_id,
          specialization,
          is_active,
          created_at,
          user:users(full_name, email, phone),
          hospital:hospitals(name),
          department:departments(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching providers:', error)
      } else if (data) {
        setProviders(data as unknown as Provider[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleDeactivate = async (providerId: string) => {
    if (!confirm('Are you sure you want to deactivate this provider?')) return

    setActionLoading(providerId)
    try {
      const result = await deactivateProvider(providerId)
      if (result.success) {
        await fetchProviders()
      } else {
        alert(result.error || 'Failed to deactivate provider')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredProviders = providers.filter((provider) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (provider.user?.full_name || '').toLowerCase().includes(searchLower) ||
      (provider.user?.email || '').toLowerCase().includes(searchLower) ||
      (provider.hospital?.name || '').toLowerCase().includes(searchLower) ||
      (provider.department?.name || '').toLowerCase().includes(searchLower)
    )
  })

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
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">Providers</h1>
          <p className="text-body text-gray-600">
            Manage hospital staff accounts ({providers.length} total)
          </p>
        </div>
        <Link href="/admin/providers/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Onboard Provider
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search providers by name, email, hospital..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Providers List */}
      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-h3 text-gray-900 mb-2">
              {searchQuery ? 'No providers found' : 'No providers yet'}
            </h3>
            <p className="text-body text-gray-600 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by onboarding your first provider'}
            </p>
            {!searchQuery && (
              <Link href="/admin/providers/new">
                <Button>Onboard First Provider</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary font-bold">
                      {(provider.user?.full_name || 'P').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-label text-gray-900">
                          {provider.user?.full_name || 'Unknown'}
                        </h3>
                        <Badge variant={provider.is_active ? 'success' : 'secondary'}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-gray-600">
                        {provider.hospital?.name || 'No hospital'} • {provider.department?.name || 'No department'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-body-sm text-gray-500">
                        <span>{provider.user?.email}</span>
                        {provider.user?.phone && <span>{provider.user.phone}</span>}
                        <span>Added {formatDate(provider.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {provider.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error hover:bg-error/10"
                        onClick={() => handleDeactivate(provider.id)}
                        disabled={actionLoading === provider.id}
                      >
                        {actionLoading === provider.id ? 'Deactivating...' : 'Deactivate'}
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
