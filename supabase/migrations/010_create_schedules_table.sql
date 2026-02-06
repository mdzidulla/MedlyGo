-- Create schedules table for hospital operating hours
-- This table stores weekly schedule configurations

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  max_patients_per_slot INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedules_provider_id ON public.schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_schedules_hospital_id ON public.schedules(hospital_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON public.schedules(day_of_week);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schedules
-- Anyone can view active schedules (for booking)
CREATE POLICY "schedules_select_policy" ON public.schedules
  FOR SELECT USING (true);

-- Providers can manage schedules for their hospital
CREATE POLICY "schedules_insert_policy" ON public.schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND (p.id = schedules.provider_id OR p.hospital_id = schedules.hospital_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "schedules_update_policy" ON public.schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND (p.id = schedules.provider_id OR p.hospital_id = schedules.hospital_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "schedules_delete_policy" ON public.schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND (p.id = schedules.provider_id OR p.hospital_id = schedules.hospital_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at_trigger
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();

-- ============================================
-- PROVIDER ACCESS TO DEPARTMENTS
-- ============================================

-- Allow providers to insert departments for their hospital
CREATE POLICY "Providers can insert departments" ON public.departments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND p.hospital_id = departments.hospital_id
      AND p.is_active = true
    )
  );

-- Allow providers to update departments for their hospital
CREATE POLICY "Providers can update departments" ON public.departments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND p.hospital_id = departments.hospital_id
      AND p.is_active = true
    )
  );

-- ============================================
-- PROVIDER ACCESS TO HOSPITALS (for settings)
-- ============================================

-- Allow providers to update their own hospital
CREATE POLICY "Providers can update own hospital" ON public.hospitals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.user_id = auth.uid()
      AND p.hospital_id = hospitals.id
      AND p.is_active = true
    )
  );
