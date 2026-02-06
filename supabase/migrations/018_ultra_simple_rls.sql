-- ULTRA SIMPLE RLS - Minimal policies, use functions for complex access
-- Run this AFTER verifying 017 ran or run it standalone

-- =============================================
-- STEP 1: FORCE DROP all policies using explicit names
-- =============================================

-- Users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_provider_select" ON public.users;
DROP POLICY IF EXISTS "Users access policy" ON public.users;
DROP POLICY IF EXISTS "Provider access to user details" ON public.users;
DROP POLICY IF EXISTS "Providers can view patient users" ON public.users;
DROP POLICY IF EXISTS "Providers can view patient user details" ON public.users;

-- Patients table
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert own record" ON public.patients;
DROP POLICY IF EXISTS "patients_select_own" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own" ON public.patients;
DROP POLICY IF EXISTS "patients_admin_select" ON public.patients;
DROP POLICY IF EXISTS "patients_provider_select" ON public.patients;
DROP POLICY IF EXISTS "Patients access policy" ON public.patients;
DROP POLICY IF EXISTS "Provider access to patients" ON public.patients;
DROP POLICY IF EXISTS "Providers can view all patients at hospital" ON public.patients;
DROP POLICY IF EXISTS "Providers can view patients at their hospital" ON public.patients;

-- Appointments table
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patient_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patient_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_patient_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_admin_delete" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_update" ON public.appointments;
DROP POLICY IF EXISTS "Appointments select policy" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update policy" ON public.appointments;
DROP POLICY IF EXISTS "Provider access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Provider can update appointments" ON public.appointments;

-- =============================================
-- STEP 2: Disable RLS temporarily to verify it's working
-- =============================================

-- We'll re-enable with simpler policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: Create helper functions
-- =============================================

DROP FUNCTION IF EXISTS public.auth_user_hospital_id();
DROP FUNCTION IF EXISTS public.auth_is_admin();
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_hospital_id(UUID);

-- Simple function to get hospital ID for current user
CREATE OR REPLACE FUNCTION public.get_my_hospital_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  hospital_id UUID;
  user_email TEXT;
BEGIN
  -- First check providers table
  SELECT p.hospital_id INTO hospital_id
  FROM public.providers p
  WHERE p.user_id = auth.uid() AND p.is_active = true
  LIMIT 1;

  IF hospital_id IS NOT NULL THEN
    RETURN hospital_id;
  END IF;

  -- Then check if email matches a hospital
  SELECT au.email INTO user_email FROM auth.users au WHERE au.id = auth.uid();

  SELECT h.id INTO hospital_id
  FROM public.hospitals h
  WHERE h.email = user_email
  LIMIT 1;

  RETURN hospital_id;
END;
$$;

-- Simple function to check if current user is admin
CREATE OR REPLACE FUNCTION public.am_i_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- =============================================
-- STEP 4: Re-enable RLS with ULTRA SIMPLE policies
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- USERS: Everyone can read all users (simplest approach - no recursion possible)
CREATE POLICY "users_read_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_write_own" ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- PATIENTS: Everyone can read all patients (simplest approach)
CREATE POLICY "patients_read_all" ON public.patients FOR SELECT USING (true);
CREATE POLICY "patients_write_own" ON public.patients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE USING (user_id = auth.uid());

-- APPOINTMENTS: More restrictive
CREATE POLICY "appointments_read" ON public.appointments
FOR SELECT USING (
  -- Own appointments
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR
  -- Admin
  public.am_i_admin()
  OR
  -- Provider at this hospital
  hospital_id = public.get_my_hospital_id()
);

CREATE POLICY "appointments_insert" ON public.appointments
FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR public.am_i_admin()
);

CREATE POLICY "appointments_update" ON public.appointments
FOR UPDATE USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR public.am_i_admin()
  OR hospital_id = public.get_my_hospital_id()
);

-- =============================================
-- STEP 5: Grant permissions
-- =============================================

GRANT EXECUTE ON FUNCTION public.get_my_hospital_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.am_i_admin() TO authenticated;
