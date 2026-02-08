import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Providers wrapper for tests
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, userEvent }

// Helper to wait for async operations
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Helper to create mock form event
export const createMockFormEvent = (
  values: Record<string, string>
): React.FormEvent<HTMLFormElement> => {
  const form = document.createElement('form')
  Object.entries(values).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  return {
    preventDefault: vi.fn(),
    currentTarget: form,
    target: form,
  } as unknown as React.FormEvent<HTMLFormElement>
}

// Helper to generate test data
export const generateTestPatient = (overrides = {}) => ({
  id: `patient-${Date.now()}`,
  user_id: `user-${Date.now()}`,
  date_of_birth: '1990-01-01',
  gender: 'Male',
  ghana_card_id: `GHA-${Math.random().toString(36).substring(7).toUpperCase()}`,
  address: '123 Test Street',
  emergency_contact_name: 'Test Contact',
  emergency_contact_phone: '+233201234567',
  ...overrides,
})

export const generateTestAppointment = (overrides = {}) => ({
  id: `apt-${Date.now()}`,
  patient_id: 'patient-123',
  hospital_id: 'hospital-123',
  department_id: 'dept-123',
  appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  start_time: '09:00',
  status: 'pending' as const,
  reference_number: `MED-${Math.random().toString(36).substring(7).toUpperCase()}`,
  reason: 'General checkup',
  ...overrides,
})

export const generateTestHospital = (overrides = {}) => ({
  id: `hospital-${Date.now()}`,
  name: 'Test Hospital',
  address: '456 Hospital Road',
  city: 'Accra',
  region: 'Greater Accra',
  phone: '+233201234568',
  email: `hospital-${Date.now()}@example.com`,
  type: 'private' as const,
  is_active: true,
  ...overrides,
})
