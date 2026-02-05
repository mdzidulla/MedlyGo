-- SIMPLE FIX for RLS recursion
-- Run this in Supabase SQL Editor
-- This removes the problematic policy that causes infinite recursion

-- ============================================
-- 1. CREATE SECURE ADMIN CHECK FUNCTION
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- 2. CREATE SECURE PROVIDER CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'provider'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_provider() TO authenticated;

-- ============================================
-- 3. DROP ALL POLICIES ON PATIENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert own record" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Providers can view their patients" ON public.patients;
DROP POLICY IF EXISTS "Providers can view all patients" ON public.patients;

-- ============================================
-- 4. DROP ALL POLICIES ON APPOINTMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can view hospital appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can update hospital appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can insert suggested appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

-- ============================================
-- 5. RECREATE SIMPLE PATIENTS POLICIES
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

-- Admins can view all patients (using secure function)
CREATE POLICY "Admins can view all patients" ON public.patients
  FOR SELECT USING (public.is_admin());

-- Providers can view all patients (simpler - no recursion)
CREATE POLICY "Providers can view all patients" ON public.patients
  FOR SELECT USING (public.is_provider());

-- ============================================
-- 6. RECREATE SIMPLE APPOINTMENTS POLICIES
-- ============================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Patients can insert their own appointments
CREATE POLICY "Patients can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Patients can update their own appointments
CREATE POLICY "Patients can update own appointments" ON public.appointments
  FOR UPDATE USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Admins can do everything with appointments
CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all appointments" ON public.appointments
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete appointments" ON public.appointments
  FOR DELETE USING (public.is_admin());

-- Providers can view and manage appointments at their hospital
CREATE POLICY "Providers can view all appointments" ON public.appointments
  FOR SELECT USING (public.is_provider());

CREATE POLICY "Providers can update appointments" ON public.appointments
  FOR UPDATE USING (public.is_provider());

CREATE POLICY "Providers can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (public.is_provider());
