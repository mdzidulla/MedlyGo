-- Allow providers/hospitals to view user data for patients with appointments at their hospital
-- This is needed for the nested query patients(users(...)) to work

-- Policy for providers to view users who are patients at their hospital
CREATE POLICY "Providers can view patient users" ON public.users
  FOR SELECT USING (
    -- User is a patient with appointments at provider's hospital
    EXISTS (
      SELECT 1 FROM public.patients pt
      JOIN public.appointments apt ON apt.patient_id = pt.id
      JOIN public.providers p ON p.hospital_id = apt.hospital_id
      WHERE pt.user_id = users.id
      AND p.user_id = auth.uid()
      AND p.is_active = true
    )
    OR
    -- User email matches a hospital and user is a patient there
    EXISTS (
      SELECT 1 FROM public.patients pt
      JOIN public.appointments apt ON apt.patient_id = pt.id
      JOIN public.hospitals h ON h.id = apt.hospital_id
      WHERE pt.user_id = users.id
      AND h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Also allow providers to see patients table data
CREATE POLICY "Providers can view all patients at hospital" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments apt
      JOIN public.providers p ON p.hospital_id = apt.hospital_id
      WHERE apt.patient_id = patients.id
      AND p.user_id = auth.uid()
      AND p.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.appointments apt
      JOIN public.hospitals h ON h.id = apt.hospital_id
      WHERE apt.patient_id = patients.id
      AND h.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
