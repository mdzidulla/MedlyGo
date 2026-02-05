-- Add missing columns to hospitals table for admin portal
-- These columns are needed for the hospital onboarding form

-- Add website column
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS website TEXT;

-- Add type column (public or private)
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private'));
