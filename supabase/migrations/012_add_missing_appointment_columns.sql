-- Add missing columns to appointments table
-- These columns are required for the appointment workflow

-- Visit reason
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- Reviewed by (provider who approved/rejected)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Reviewed at timestamp
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Rejection reason
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Original appointment ID for suggested alternatives
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS original_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Suggested date for alternative suggestions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS suggested_date DATE;

-- Suggested time for alternative suggestions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS suggested_time TIME;

-- Checked in timestamp
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Completed timestamp
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Cancelled timestamp
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Provider ID (optional, for doctor-specific appointments)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_appointments_reviewed_by ON public.appointments(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_appointments_original_id ON public.appointments(original_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);

-- Update status constraint to include all statuses
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'rejected',
    'suggested',
    'scheduled',
    'checked_in',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
  ));
