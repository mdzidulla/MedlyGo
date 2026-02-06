-- FINAL RLS FIX - Completely avoid recursion by using SECURITY DEFINER functions
-- This approach uses helper functions that bypass RLS to check user roles

-- =============================================
-- STEP 1: Drop ALL problematic policies
-- =============================================

DROP POLICY IF EXISTS "Providers can view patient users" ON public.users;
DROP POLICY IF EXISTS "Providers can view all patients at hospital" ON public.patients;
DROP POLICY IF EXISTS "Providers can view patients at their hospital" ON public.patients;
DROP POLICY IF EXISTS "Providers can view patient user details" ON public.users;
DROP POLICY IF EXISTS "Provider access to patients" ON public.patients;
DROP POLICY IF EXISTS "Provider access to user details" ON public.users;
DROP POLICY IF EXISTS "Provider access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Provider can update appointments" ON public.appointments;

-- =============================================
-- STEP 2: Create SECURITY DEFINER functions to check roles without RLS
-- These functions bypass RLS and can be safely called from policies
-- =============================================

-- Function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND role = 'admin');
$$;

-- Function to check if user is a provider for a specific hospital
CREATE OR REPLACE FUNCTION public.is_provider_for_hospital(user_id UUID, hospital_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.user_id = is_provider_for_hospital.user_id
    AND hospital_id = hospital_uuid
    AND is_active = true
  );
$$;

-- Function to get hospital ID by email
CREATE OR REPLACE FUNCTION public.get_hospital_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.hospitals WHERE email = user_email LIMIT 1;
$$;

-- Function to get user's hospital ID (either via providers table or email match)
CREATE OR REPLACE FUNCTION public.get_user_hospital_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT hospital_id FROM public.providers WHERE providers.user_id = get_user_hospital_id.user_id AND is_active = true LIMIT 1),
    (SELECT h.id FROM public.hospitals h
     INNER JOIN auth.users au ON au.email = h.email
     WHERE au.id = get_user_hospital_id.user_id LIMIT 1)
  );
$$;

-- =============================================
-- STEP 3: Create simple policies using the helper functions
-- =============================================

-- USERS TABLE: Simple policy - users can see their own record, admins can see all
CREATE POLICY "Users access policy" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_admin(auth.uid())
    OR (
      -- Provider can see users who are patients at their hospital
      public.get_user_hospital_id(auth.uid()) IS NOT NULL
      AND id IN (
        SELECT pt.user_id FROM public.patients pt
        INNER JOIN public.appointments a ON a.patient_id = pt.id
        WHERE a.hospital_id = public.get_user_hospital_id(auth.uid())
      )
    )
  );

-- PATIENTS TABLE: Patients see own record, providers see patients at their hospital
CREATE POLICY "Patients access policy" ON public.patients
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR (
      public.get_user_hospital_id(auth.uid()) IS NOT NULL
      AND id IN (
        SELECT a.patient_id FROM public.appointments a
        WHERE a.hospital_id = public.get_user_hospital_id(auth.uid())
      )
    )
  );

-- APPOINTMENTS TABLE: Patients see own, providers see their hospital's, admins see all
CREATE POLICY "Appointments select policy" ON public.appointments
  FOR SELECT USING (
    -- Patient's own appointments
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    -- Admin access
    OR public.is_admin(auth.uid())
    -- Provider access to their hospital
    OR hospital_id = public.get_user_hospital_id(auth.uid())
  );

CREATE POLICY "Appointments update policy" ON public.appointments
  FOR UPDATE USING (
    -- Patient's own appointments
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    -- Admin access
    OR public.is_admin(auth.uid())
    -- Provider access to their hospital
    OR hospital_id = public.get_user_hospital_id(auth.uid())
  );

-- =============================================
-- STEP 4: Grant execute permissions on functions
-- =============================================

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_provider_for_hospital(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hospital_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_hospital_id(UUID) TO authenticated;
