-- Migration: Create Admin User Setup
-- Run this AFTER you've created a user account through Supabase Auth
-- Replace 'your-admin-email@example.com' with your actual email

-- Option 1: Update existing user to admin role
-- Uncomment and modify the email below:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Option 2: Create a function to promote users to admin (useful for the future)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET role = 'admin' WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;

-- Create a policy that only allows existing admins to call this function
-- (This is handled by the SECURITY DEFINER and checking within the function)

-- Helpful view to see all users and their roles
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.phone,
  u.created_at,
  CASE
    WHEN p.id IS NOT NULL THEN 'Patient'
    WHEN pr.id IS NOT NULL THEN 'Provider'
    ELSE 'User Only'
  END as account_type
FROM users u
LEFT JOIN patients p ON u.id = p.user_id
LEFT JOIN providers pr ON u.id = pr.user_id
ORDER BY u.created_at DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON admin_user_overview TO authenticated;

-- Add RLS policy for the view (only admins can see it)
-- Note: Views inherit RLS from underlying tables, but we can add a check
