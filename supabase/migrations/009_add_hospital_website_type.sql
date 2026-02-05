-- Add website and type columns to hospitals table
-- Run this in Supabase SQL Editor

-- Add website column (optional field)
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS website TEXT;

-- Add type column (public or private)
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private'));
