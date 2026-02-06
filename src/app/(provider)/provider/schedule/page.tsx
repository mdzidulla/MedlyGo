'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HospitalSchedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  max_patients_per_slot: number
  is_active: boolean
}

interface Department {
  id: string
  name: string
  is_active: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
]

export default function SchedulePage() {
  const [hospitalId, setHospitalId] = React.useState<string | null>(null)
  const [schedules, setSchedules] = React.useState<HospitalSchedule[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<HospitalSchedule | null>(null)
  const [newDeptName, setNewDeptName] = React.useState('')
  const [addingDept, setAddingDept] = React.useState(false)

  // Form state for editing
  const [formData, setFormData] = React.useState({
    day_of_week: 1,
    start_time: '08:00',
    end_time: '17:00',
    slot_duration: 30,
    max_patients_per_slot: 1,
    is_active: true,
  })

  const supabase = createClient()
  // eslint-disable-next-line
  const client = supabase as any

  const fetchData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get hospital ID
      let hId: string | null = null

      const { data: provider } = await client
        .from('providers')
        .select('hospital_id')
        .eq('user_id', user.id)
        .single()

      if (provider) {
        hId = provider.hospital_id
      } else {
        const { data: hospitalByEmail } = await client
          .from('hospitals')
          .select('id')
          .eq('email', user.email)
          .single()

        if (hospitalByEmail) {
          hId = hospitalByEmail.id
        }
      }

      if (!hId) {
        setIsLoading(false)
        return
      }

      setHospitalId(hId)

      // Fetch schedules - we'll use a hospital_schedules approach
      // Since schedules table is provider-based, we need to check if there's a hospital-level approach
      // For now, let's fetch hospital info and departments

      // Fetch departments
      const { data: deptData } = await client
        .from('departments')
        .select('id, name, is_active')
        .eq('hospital_id', hId)
        .order('name')

      if (deptData) {
        setDepartments(deptData)
      }

      // For hospital-level schedules, we might need to create a simple schedule management
      // Let's check if there's existing provider schedules we can display
      const { data: providerData } = await client
        .from('providers')
        .select('id')
        .eq('hospital_id', hId)
        .limit(1)
        .single()

      if (providerData) {
        const { data: scheduleData } = await client
          .from('schedules')
          .select('*')
          .eq('provider_id', providerData.id)
          .order('day_of_week')

        if (scheduleData) {
          setSchedules(scheduleData)
        }
      }

    } catch (error) {
      console.error('Error fetching schedule data:', error)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEditSchedule = (schedule: HospitalSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration: schedule.slot_duration,
      max_patients_per_slot: schedule.max_patients_per_slot,
      is_active: schedule.is_active,
    })
    setEditModalOpen(true)
  }

  const handleAddSchedule = () => {
    setEditingSchedule(null)
    setFormData({
      day_of_week: 1,
      start_time: '08:00',
      end_time: '17:00',
      slot_duration: 30,
      max_patients_per_slot: 1,
      is_active: true,
    })
    setEditModalOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!hospitalId) return

    setIsSaving(true)
    try {
      // Get or create a provider for this hospital
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let providerId: string | null = null

      const { data: provider } = await client
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (provider) {
        providerId = provider.id
      } else {
        // Get any provider from this hospital
        const { data: anyProvider } = await client
          .from('providers')
          .select('id')
          .eq('hospital_id', hospitalId)
          .limit(1)
          .single()

        if (anyProvider) {
          providerId = anyProvider.id
        }
      }

      if (!providerId) {
        alert('No provider found for this hospital')
        return
      }

      if (editingSchedule) {
        // Update existing
        const { error } = await client
          .from('schedules')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchedule.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await client
          .from('schedules')
          .insert({
            provider_id: providerId,
            ...formData,
          })

        if (error) throw error
      }

      setEditModalOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const { error } = await client
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Failed to delete schedule')
    }
  }

  const handleToggleSchedule = async (schedule: HospitalSchedule) => {
    try {
      const { error } = await client
        .from('schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error toggling schedule:', error)
    }
  }

  const handleAddDepartment = async () => {
    if (!hospitalId || !newDeptName.trim()) return

    setAddingDept(true)
    try {
      const { error } = await client
        .from('departments')
        .insert({
          hospital_id: hospitalId,
          name: newDeptName.trim(),
          is_active: true,
        })

      if (error) throw error
      setNewDeptName('')
      await fetchData()
    } catch (error) {
      console.error('Error adding department:', error)
      alert('Failed to add department')
    } finally {
      setAddingDept(false)
    }
  }

  const handleToggleDepartment = async (dept: Department) => {
    try {
      const { error } = await client
        .from('departments')
        .update({ is_active: !dept.is_active })
        .eq('id', dept.id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error toggling department:', error)
    }
  }

  const getDayName = (dayNum: number): string => {
    return DAYS_OF_WEEK.find(d => d.value === dayNum)?.label || ''
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Edit Schedule Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-h3 text-gray-900 mb-4">
                {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-label text-gray-700 mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label text-gray-700 mb-1">Start Time</label>
                    <select
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-1">End Time</label>
                    <select
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label text-gray-700 mb-1">Slot Duration (mins)</label>
                    <select
                      value={formData.slot_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, slot_duration: Number(e.target.value) }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label text-gray-700 mb-1">Max Patients/Slot</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.max_patients_per_slot}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_patients_per_slot: Number(e.target.value) }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-body text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">Schedule Management</h1>
          <p className="text-body text-gray-600">
            Manage your hospital&apos;s operating hours and departments
          </p>
        </div>
        <Button onClick={handleAddSchedule}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Schedule
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-body text-gray-600 mb-4">No schedules configured</p>
                <Button variant="outline" onClick={handleAddSchedule}>
                  Add Your First Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS_OF_WEEK.map(day => {
                  const daySchedules = schedules.filter(s => s.day_of_week === day.value)

                  return (
                    <div
                      key={day.value}
                      className={cn(
                        'p-4 rounded-lg border',
                        daySchedules.length > 0 && daySchedules.some(s => s.is_active)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                            daySchedules.length > 0 && daySchedules.some(s => s.is_active)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          )}>
                            {day.short}
                          </span>
                          <div>
                            <p className="text-label text-gray-900">{day.label}</p>
                            {daySchedules.length > 0 ? (
                              <p className="text-body-sm text-gray-600">
                                {daySchedules.map(s => `${s.start_time} - ${s.end_time}`).join(', ')}
                              </p>
                            ) : (
                              <p className="text-body-sm text-gray-500">Closed</p>
                            )}
                          </div>
                        </div>
                        {daySchedules.length > 0 && (
                          <div className="flex items-center gap-2">
                            {daySchedules.map(schedule => (
                              <div key={schedule.id} className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleSchedule(schedule)}
                                  className={cn(
                                    'p-1 rounded',
                                    schedule.is_active ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                                  )}
                                  title={schedule.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEditSchedule(schedule)}
                                  className="p-1 rounded text-gray-600 hover:bg-gray-100"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="p-1 rounded text-red-600 hover:bg-red-100"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Departments</CardTitle>
            <Badge variant="info">{departments.length} total</Badge>
          </CardHeader>
          <CardContent>
            {/* Add Department */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Department name..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                className="flex-1 h-10 px-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <Button
                onClick={handleAddDepartment}
                disabled={addingDept || !newDeptName.trim()}
                size="sm"
              >
                {addingDept ? 'Adding...' : 'Add'}
              </Button>
            </div>

            {departments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-body text-gray-600">No departments yet</p>
                <p className="text-body-sm text-gray-500">Add departments above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map(dept => (
                  <div
                    key={dept.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      dept.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        dept.is_active ? 'bg-green-500' : 'bg-gray-300'
                      )} />
                      <span className={cn(
                        'text-body',
                        dept.is_active ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {dept.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleDepartment(dept)}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-medium',
                        dept.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-label text-gray-900 mb-3">Quick Tips</h3>
          <div className="grid md:grid-cols-3 gap-4 text-body-sm text-gray-600">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Set your operating hours for each day of the week. Patients can only book during these times.</p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Add departments to organize your services. Patients select a department when booking.</p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Deactivate schedules or departments temporarily without deleting them.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
