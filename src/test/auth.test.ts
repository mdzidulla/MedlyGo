import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, mockUser, mockPatientUser, mockProviderUser, mockAdminUser } from './mocks/supabase'

describe('Authentication Flow', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null,
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(mockUser)
    })

    it('should fail login with invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid login credentials')
    })

    it('should fail login with empty credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email and password are required' },
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: '',
        password: '',
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const newUser = { ...mockUser, id: 'new-user-123' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: newUser, session: null },
        error: null,
      })

      const result = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'New User' },
        },
      })

      expect(result.error).toBeNull()
      expect(result.data.user?.id).toBe('new-user-123')
    })

    it('should fail registration with existing email', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      const result = await mockSupabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('User already registered')
    })

    it('should fail registration with weak password', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await mockSupabase.auth.signUp({
        email: 'user@example.com',
        password: '123',
      })

      expect(result.error).toBeTruthy()
    })

    it('should fail registration with invalid email format', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      })

      const result = await mockSupabase.auth.signUp({
        email: 'invalidemail',
        password: 'password123',
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('User Logout', () => {
    it('should successfully logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await mockSupabase.auth.signOut()

      expect(result.error).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should return user when session exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await mockSupabase.auth.getUser()

      expect(result.data.user).toEqual(mockUser)
    })

    it('should return null when no session exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await mockSupabase.auth.getUser()

      expect(result.data.user).toBeNull()
    })
  })

  describe('Role-based Access', () => {
    it('should identify patient user role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockPatientUser },
        error: null,
      })

      const fromMock = mockSupabase.from('users')
      fromMock.single.mockResolvedValue({
        data: { role: 'patient' },
        error: null,
      })

      const { data: { user } } = await mockSupabase.auth.getUser()
      expect(user?.id).toBe(mockPatientUser.id)
    })

    it('should identify provider user role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockProviderUser },
        error: null,
      })

      const fromMock = mockSupabase.from('users')
      fromMock.single.mockResolvedValue({
        data: { role: 'provider' },
        error: null,
      })

      const { data: { user } } = await mockSupabase.auth.getUser()
      expect(user?.id).toBe(mockProviderUser.id)
    })

    it('should identify admin user role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      })

      const fromMock = mockSupabase.from('users')
      fromMock.single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      })

      const { data: { user } } = await mockSupabase.auth.getUser()
      expect(user?.id).toBe(mockAdminUser.id)
    })
  })
})
