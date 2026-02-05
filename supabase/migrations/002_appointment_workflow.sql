-- MedlyGo Appointment Workflow Migration
-- This migration adds the appointment approval workflow and provider/admin support

-- ============================================
-- 1. UPDATE APPOINTMENT STATUS CONSTRAINT
-- ============================================

-- Drop the existing status check constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new status constraint with additional statuses
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending',      -- Patient booked, awaiting hospital approval
    'confirmed',    -- Hospital approved
    'rejected',     -- Hospital rejected
    'suggested',    -- Hospital suggested alternative (linked to original)
    'scheduled',    -- Legacy status
    'checked_in',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
  ));

-- Update default status from 'scheduled' to 'pending'
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'pending';

-- ============================================
-- 2. ADD NEW COLUMNS TO APPOINTMENTS TABLE
-- ============================================

-- Add reviewed_by column (provider who approved/rejected)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add reviewed_at timestamp
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add rejection_reason
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add original_appointment_id for suggested alternatives (links to rejected appointment)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS original_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Add suggested_date for alternative suggestions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS suggested_date DATE;

-- Add suggested_time for alternative suggestions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS suggested_time TIME;

-- Add reason for visit (if not exists)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================
-- 3. CREATE PROVIDERS TABLE
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

-- Add updated_at trigger for providers
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for providers
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_hospital_id ON public.providers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_providers_department_id ON public.providers(department_id);

-- ============================================
-- 4. CREATE INDEX FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_reviewed_by ON public.appointments(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_appointments_original_id ON public.appointments(original_appointment_id);

-- ============================================
-- 5. RLS POLICIES FOR PROVIDERS TABLE
-- ============================================

-- Providers can view their own record
CREATE POLICY "Providers can view own record" ON public.providers
  FOR SELECT USING (auth.uid() = user_id);

-- Providers can update their own record
CREATE POLICY "Providers can update own record" ON public.providers
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all providers
CREATE POLICY "Admins can view all providers" ON public.providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert providers
CREATE POLICY "Admins can insert providers" ON public.providers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update providers
CREATE POLICY "Admins can update providers" ON public.providers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete providers
CREATE POLICY "Admins can delete providers" ON public.providers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. RLS POLICIES FOR APPOINTMENTS (PROVIDER ACCESS)
-- ============================================

-- Providers can view appointments for their hospital
CREATE POLICY "Providers can view hospital appointments" ON public.appointments
  FOR SELECT USING (
    hospital_id IN (
      SELECT hospital_id FROM public.providers
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Providers can update appointments for their hospital (approve/reject/suggest)
CREATE POLICY "Providers can update hospital appointments" ON public.appointments
  FOR UPDATE USING (
    hospital_id IN (
      SELECT hospital_id FROM public.providers
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Providers can insert appointments (for creating suggested alternatives)
CREATE POLICY "Providers can insert suggested appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE user_id = auth.uid()
      AND hospital_id = appointments.hospital_id
      AND is_active = true
    )
  );

-- ============================================
-- 7. RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all appointments
CREATE POLICY "Admins can update all appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert appointments
CREATE POLICY "Admins can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete appointments
CREATE POLICY "Admins can delete appointments" ON public.appointments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. RLS POLICIES FOR HOSPITALS (ADMIN WRITE ACCESS)
-- ============================================

-- Admins can insert hospitals
CREATE POLICY "Admins can insert hospitals" ON public.hospitals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update hospitals
CREATE POLICY "Admins can update hospitals" ON public.hospitals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete hospitals
CREATE POLICY "Admins can delete hospitals" ON public.hospitals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. RLS POLICIES FOR DEPARTMENTS (ADMIN WRITE ACCESS)
-- ============================================

-- Admins can insert departments
CREATE POLICY "Admins can insert departments" ON public.departments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update departments
CREATE POLICY "Admins can update departments" ON public.departments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete departments
CREATE POLICY "Admins can delete departments" ON public.departments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 10. RLS POLICIES FOR USERS (ADMIN ACCESS)
-- ============================================

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users AS admin_check
      WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
    )
  );

-- Admins can update all users (for role changes)
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users AS admin_check
      WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
    )
  );

-- ============================================
-- 11. RLS POLICIES FOR PATIENTS (ADMIN/PROVIDER VIEW)
-- ============================================

-- Admins can view all patients
CREATE POLICY "Admins can view all patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
-- 12. HELPER FUNCTION FOR REFERENCE NUMBER GENERATION
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref_number TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  ref_number := 'MG-' || date_part || '-' || random_part;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.appointments WHERE reference_number = ref_number) LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    ref_number := 'MG-' || date_part || '-' || random_part;
  END LOOP;

  RETURN ref_number;
END;
$$ LANGUAGE plpgsql;
