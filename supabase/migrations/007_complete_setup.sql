-- Complete Setup Script for MedlyGo Admin Portal
-- Run this in Supabase SQL Editor
-- This script is idempotent (safe to run multiple times)

-- ============================================
-- 1. CREATE PROVIDERS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  specialization TEXT,
  credentials TEXT,
  bio TEXT,
  consultation_duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create indexes for providers (ignore if exists)
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_hospital_id ON public.providers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_providers_department_id ON public.providers(department_id);

-- ============================================
-- 2. CREATE SECURE ADMIN CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- 3. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- Patients table policies
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert own record" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Providers can view their patients" ON public.patients;

-- Providers table policies
DROP POLICY IF EXISTS "Providers can view own record" ON public.providers;
DROP POLICY IF EXISTS "Providers can update own record" ON public.providers;
DROP POLICY IF EXISTS "Admins can view all providers" ON public.providers;
DROP POLICY IF EXISTS "Admins can insert providers" ON public.providers;
DROP POLICY IF EXISTS "Admins can update providers" ON public.providers;
DROP POLICY IF EXISTS "Admins can delete providers" ON public.providers;

-- ============================================
-- 4. CREATE USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users (using the secure function)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Admins can insert users (for creating hospital accounts)
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================
-- 5. CREATE PATIENTS TABLE POLICIES
-- ============================================

-- Patients can view their own record
CREATE POLICY "Patients can view own record" ON public.patients
  FOR SELECT USING (auth.uid() = user_id);

-- Patients can update their own record
CREATE POLICY "Patients can update own record" ON public.patients
  FOR UPDATE USING (auth.uid() = user_id);

-- Patients can insert their own record
CREATE POLICY "Patients can insert own record" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all patients
CREATE POLICY "Admins can view all patients" ON public.patients
  FOR SELECT USING (public.is_admin());

-- Providers can view patients who have appointments at their hospital
CREATE POLICY "Providers can view their patients" ON public.patients
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT patient_id FROM public.appointments
      WHERE hospital_id IN (
        SELECT hospital_id FROM public.providers
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ============================================
-- 6. CREATE PROVIDERS TABLE POLICIES
-- ============================================

-- Providers can view their own record
CREATE POLICY "Providers can view own record" ON public.providers
  FOR SELECT USING (auth.uid() = user_id);

-- Providers can update their own record
CREATE POLICY "Providers can update own record" ON public.providers
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all providers
CREATE POLICY "Admins can view all providers" ON public.providers
  FOR SELECT USING (public.is_admin());

-- Admins can insert providers
CREATE POLICY "Admins can insert providers" ON public.providers
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update providers
CREATE POLICY "Admins can update providers" ON public.providers
  FOR UPDATE USING (public.is_admin());

-- Admins can delete providers
CREATE POLICY "Admins can delete providers" ON public.providers
  FOR DELETE USING (public.is_admin());

-- ============================================
-- 7. VERIFY SETUP - Run these queries to check
-- ============================================

-- Check admin user exists:
-- SELECT id, email, full_name, role FROM public.users WHERE role = 'admin';

-- Check patients exist:
-- SELECT p.id, u.email, u.full_name, u.role FROM public.patients p JOIN public.users u ON p.user_id = u.id;

-- Make a user admin (replace email):
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
