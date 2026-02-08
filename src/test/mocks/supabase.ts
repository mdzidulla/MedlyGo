import { vi } from 'vitest'

// Mock user data
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
}

export const mockPatientUser = {
  id: 'patient-user-123',
  email: 'patient@example.com',
  user_metadata: {
    full_name: 'Test Patient',
  },
}

export const mockProviderUser = {
  id: 'provider-user-123',
  email: 'hospital@example.com',
  user_metadata: {
    full_name: 'Test Hospital',
  },
}

export const mockAdminUser = {
  id: 'admin-user-123',
  email: 'admin@example.com',
  user_metadata: {
    full_name: 'Test Admin',
  },
}

// Mock patient profile
export const mockPatientProfile = {
  id: 'patient-123',
  user_id: 'patient-user-123',
  date_of_birth: '1990-01-01',
  gender: 'Male',
  ghana_card_id: 'GHA-123456789',
  address: '123 Test Street, Accra',
  emergency_contact_name: 'Emergency Contact',
  emergency_contact_phone: '+233201234567',
}

// Mock hospital
export const mockHospital = {
  id: 'hospital-123',
  name: 'Test Hospital',
  address: '456 Hospital Road',
  city: 'Accra',
  region: 'Greater Accra',
  phone: '+233201234568',
  email: 'hospital@example.com',
  type: 'private' as const,
  is_active: true,
}

// Mock department
export const mockDepartment = {
  id: 'dept-123',
  hospital_id: 'hospital-123',
  name: 'General Medicine',
  is_active: true,
}

// Mock appointment
export const mockAppointment = {
  id: 'apt-123',
  patient_id: 'patient-123',
  hospital_id: 'hospital-123',
  department_id: 'dept-123',
  appointment_date: '2026-02-10',
  start_time: '09:00',
  status: 'pending' as const,
  reference_number: 'MED-ABC123',
  reason: 'General checkup',
}

// Create mock Supabase client
export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: mockUser } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }
  return mockClient
}

// Mock for createClient
export const mockCreateClient = vi.fn(() => createMockSupabaseClient())
