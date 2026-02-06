-- Fix infinite recursion in RLS policies for patients table
-- The previous policy caused recursion because it joined appointments -> patients -> appointments

-- First, drop the problematic policies from migration 013
DROP POLICY IF EXISTS "Providers can view patient users" ON public.users;
DROP POLICY IF EXISTS "Providers can view all patients at hospital" ON public.patients;

-- Create a simpler policy for patients table that doesn't cause recursion
-- This policy allows providers to view patients if they have an appointment at the provider's hospital
-- We use a direct check on appointments without joining back to patients

-- Policy for patients table - use hospital_id directly from appointments
CREATE POLICY "Providers can view patients at their hospital" ON public.patients
  FOR SELECT USING (
    -- Check if this patient has any appointment at a hospital where the current user is a provider
    id IN (
      SELECT apt.patient_id
      FROM public.appointments apt
      INNER JOIN public.providers p ON p.hospital_id = apt.hospital_id
      WHERE p.user_id = auth.uid()
      AND p.is_active = true
    )
    OR
    -- Or if user's email matches a hospital that has an appointment with this patient
    id IN (
      SELECT apt.patient_id
      FROM public.appointments apt
      INNER JOIN public.hospitals h ON h.id = apt.hospital_id
      WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policy for users table - allow providers to see user details for their patients
-- This uses the same logic but checks if the user is linked to a patient at their hospital
CREATE POLICY "Providers can view patient user details" ON public.users
  FOR SELECT USING (
    -- User can see their own record
    id = auth.uid()
    OR
    -- Provider can see users who are patients at their hospital
    id IN (
      SELECT pt.user_id
      FROM public.patients pt
      INNER JOIN public.appointments apt ON apt.patient_id = pt.id
      INNER JOIN public.providers p ON p.hospital_id = apt.hospital_id
      WHERE p.user_id = auth.uid()
      AND p.is_active = true
    )
    OR
    -- Hospital email match - can see users who are patients at their hospital
    id IN (
      SELECT pt.user_id
      FROM public.patients pt
      INNER JOIN public.appointments apt ON apt.patient_id = pt.id
      INNER JOIN public.hospitals h ON h.id = apt.hospital_id
      WHERE h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
