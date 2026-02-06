-- Add operating hours columns to hospitals table

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS is_24_hours BOOLEAN DEFAULT false;

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS opening_time TIME;

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS closing_time TIME;

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1) DEFAULT 0;

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
