-- Fix RLS policies for admin access
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING CONFLICTING POLICIES (if any)
-- ============================================

-- Drop existing admin policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Drop existing admin policies on patients table
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;

-- ============================================
-- 2. CREATE ADMIN POLICIES FOR USERS TABLE
-- ============================================

-- Admins can view ALL users (not just their own)
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

-- Admins can insert users (for creating hospital accounts)
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users AS admin_check
      WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
    )
  );

-- ============================================
-- 3. CREATE ADMIN POLICIES FOR PATIENTS TABLE
-- ============================================

-- Admins can view ALL patients
CREATE POLICY "Admins can view all patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 4. VERIFY YOUR ADMIN USER
-- ============================================

-- Check if you have an admin user. Run this to see:
-- SELECT id, email, full_name, role FROM public.users WHERE role = 'admin';

-- If no admin user exists, update your user to be admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
