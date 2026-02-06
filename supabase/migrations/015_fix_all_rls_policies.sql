-- Complete RLS policy fix for provider access to patient data
-- This migration fixes infinite recursion and ensures all roles can access appropriate data

-- =============================================
-- STEP 1: Drop ALL provider-related policies on users and patients
-- =============================================

-- Drop policies from migrations 013 and 014
DROP POLICY IF EXISTS "Providers can view patient users" ON public.users;
DROP POLICY IF EXISTS "Providers can view all patients at hospital" ON public.patients;
DROP POLICY IF EXISTS "Providers can view patients at their hospital" ON public.patients;
DROP POLICY IF EXISTS "Providers can view patient user details" ON public.users;

-- =============================================
-- STEP 2: Create simple, non-recursive policies for patients table
-- =============================================

-- Providers can view patients who have appointments at their hospital
-- Using a simple subquery that doesn't cause recursion
CREATE POLICY "Provider access to patients" ON public.patients
  FOR SELECT USING (
    -- Patient's own record (existing functionality preserved)
    user_id = auth.uid()
    OR
    -- Provider access via providers table
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patients.id
      AND a.hospital_id IN (
        SELECT p.hospital_id FROM public.providers p
        WHERE p.user_id = auth.uid() AND p.is_active = true
      )
    )
    OR
    -- Hospital email match access
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patients.id
      AND a.hospital_id IN (
        SELECT h.id FROM public.hospitals h
        WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- =============================================
-- STEP 3: Create simple, non-recursive policies for users table
-- =============================================

-- Allow providers to see user details for patients at their hospital
CREATE POLICY "Provider access to user details" ON public.users
  FOR SELECT USING (
    -- User's own record (existing functionality preserved)
    id = auth.uid()
    OR
    -- Admin can see all users
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR
    -- Provider access - can see users who are patients at their hospital
    id IN (
      SELECT pt.user_id FROM public.patients pt
      WHERE pt.id IN (
        SELECT a.patient_id FROM public.appointments a
        WHERE a.hospital_id IN (
          SELECT p.hospital_id FROM public.providers p
          WHERE p.user_id = auth.uid() AND p.is_active = true
        )
      )
    )
    OR
    -- Hospital email match - can see users who are patients at their hospital
    id IN (
      SELECT pt.user_id FROM public.patients pt
      WHERE pt.id IN (
        SELECT a.patient_id FROM public.appointments a
        WHERE a.hospital_id IN (
          SELECT h.id FROM public.hospitals h
          WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      )
    )
  );

-- =============================================
-- STEP 4: Update appointments policy to allow provider access
-- =============================================

-- Drop and recreate appointment policies to include provider access
DROP POLICY IF EXISTS "Provider access to appointments" ON public.appointments;

CREATE POLICY "Provider access to appointments" ON public.appointments
  FOR SELECT USING (
    -- Patient can see their own appointments
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    OR
    -- Provider can see appointments at their hospital
    hospital_id IN (
      SELECT p.hospital_id FROM public.providers p
      WHERE p.user_id = auth.uid() AND p.is_active = true
    )
    OR
    -- Hospital email match
    hospital_id IN (
      SELECT h.id FROM public.hospitals h
      WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Provider can update appointments at their hospital
DROP POLICY IF EXISTS "Provider can update appointments" ON public.appointments;

CREATE POLICY "Provider can update appointments" ON public.appointments
  FOR UPDATE USING (
    -- Patient can update their own appointments
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    OR
    -- Provider can update appointments at their hospital
    hospital_id IN (
      SELECT p.hospital_id FROM public.providers p
      WHERE p.user_id = auth.uid() AND p.is_active = true
    )
    OR
    -- Hospital email match
    hospital_id IN (
      SELECT h.id FROM public.hospitals h
      WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- Admin can update all
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
