-- Fix RLS recursion issue for admin access
-- The problem: Admin check policies on 'users' table cause infinite recursion
-- Solution: Use auth.jwt() to get role from metadata instead of querying users table

-- ============================================
-- 1. FIRST: Create a secure function to check admin status
-- This avoids the recursion by using SECURITY DEFINER
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
-- 2. DROP ALL EXISTING ADMIN-RELATED POLICIES
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

-- ============================================
-- 3. RECREATE USERS TABLE POLICIES
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
-- 4. RECREATE PATIENTS TABLE POLICIES
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
-- 5. VERIFY ADMIN USER EXISTS
-- ============================================

-- Run this to check your admin user:
-- SELECT id, email, full_name, role FROM public.users WHERE role = 'admin';

-- If you need to make a user admin, run:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
