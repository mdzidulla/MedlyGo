-- NUCLEAR RESET: Drop ALL policies and recreate from scratch
-- This ensures no conflicting policies exist

-- =============================================
-- STEP 1: Drop ALL policies on users, patients, appointments
-- =============================================

-- Drop ALL policies on users table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on patients table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patients' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.patients', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL policies on appointments table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
    END LOOP;
END $$;

-- =============================================
-- STEP 2: Create helper function with SECURITY DEFINER
-- =============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_provider_for_hospital(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_hospital_id_by_email(TEXT);
DROP FUNCTION IF EXISTS public.get_user_hospital_id(UUID);

-- Create a single function to get user's hospital ID
CREATE OR REPLACE FUNCTION public.auth_user_hospital_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    -- Check providers table first
    (SELECT hospital_id FROM public.providers WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    -- Then check if email matches a hospital
    (SELECT h.id FROM public.hospitals h WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1)
  );
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- =============================================
-- STEP 3: Create SIMPLE policies - NO subqueries on the same table
-- =============================================

-- USERS TABLE POLICIES
-- Policy 1: Users can always see their own record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can update their own record
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Policy 3: Users can insert their own record
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Policy 4: Admins can see all users (uses SECURITY DEFINER function)
CREATE POLICY "users_admin_select" ON public.users
  FOR SELECT USING (public.auth_is_admin());

-- Policy 5: Providers can see patient users at their hospital
CREATE POLICY "users_provider_select" ON public.users
  FOR SELECT USING (
    public.auth_user_hospital_id() IS NOT NULL
    AND id IN (
      SELECT pt.user_id
      FROM public.patients pt
      INNER JOIN public.appointments a ON a.patient_id = pt.id
      WHERE a.hospital_id = public.auth_user_hospital_id()
    )
  );

-- PATIENTS TABLE POLICIES
-- Policy 1: Patients can see their own record
CREATE POLICY "patients_select_own" ON public.patients
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Patients can update their own record
CREATE POLICY "patients_update_own" ON public.patients
  FOR UPDATE USING (user_id = auth.uid());

-- Policy 3: Patients can insert their own record
CREATE POLICY "patients_insert_own" ON public.patients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 4: Admins can see all patients
CREATE POLICY "patients_admin_select" ON public.patients
  FOR SELECT USING (public.auth_is_admin());

-- Policy 5: Providers can see patients at their hospital
CREATE POLICY "patients_provider_select" ON public.patients
  FOR SELECT USING (
    public.auth_user_hospital_id() IS NOT NULL
    AND id IN (
      SELECT a.patient_id
      FROM public.appointments a
      WHERE a.hospital_id = public.auth_user_hospital_id()
    )
  );

-- APPOINTMENTS TABLE POLICIES
-- Policy 1: Patients can see their own appointments
CREATE POLICY "appointments_patient_select" ON public.appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Policy 2: Patients can insert their own appointments
CREATE POLICY "appointments_patient_insert" ON public.appointments
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Policy 3: Patients can update their own appointments
CREATE POLICY "appointments_patient_update" ON public.appointments
  FOR UPDATE USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Policy 4: Admins can do everything
CREATE POLICY "appointments_admin_select" ON public.appointments
  FOR SELECT USING (public.auth_is_admin());

CREATE POLICY "appointments_admin_update" ON public.appointments
  FOR UPDATE USING (public.auth_is_admin());

CREATE POLICY "appointments_admin_insert" ON public.appointments
  FOR INSERT WITH CHECK (public.auth_is_admin());

CREATE POLICY "appointments_admin_delete" ON public.appointments
  FOR DELETE USING (public.auth_is_admin());

-- Policy 5: Providers can see and update appointments at their hospital
CREATE POLICY "appointments_provider_select" ON public.appointments
  FOR SELECT USING (
    public.auth_user_hospital_id() IS NOT NULL
    AND hospital_id = public.auth_user_hospital_id()
  );

CREATE POLICY "appointments_provider_update" ON public.appointments
  FOR UPDATE USING (
    public.auth_user_hospital_id() IS NOT NULL
    AND hospital_id = public.auth_user_hospital_id()
  );

-- =============================================
-- STEP 4: Grant permissions
-- =============================================
GRANT EXECUTE ON FUNCTION public.auth_user_hospital_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_admin() TO authenticated;
