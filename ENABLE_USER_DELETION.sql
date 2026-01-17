-- ================================================================
-- ENABLE USER DELETION POLICY
-- ================================================================
-- This script adds a Row Level Security (RLS) policy to allow 
-- Admins to delete users from the public.users table.
--
-- Currently, user deletion fails silently because there is no 
-- policy matching the DELETE operation.
-- ================================================================

-- 1. Create policy - Only Admins can delete users
-- We use the same check as the "Only admins can update user roles" policy
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'Admin'
  )
);

-- ================================================================
-- INSTRUCTIONS:
-- Copy and run this script in the Supabase SQL Editor.
-- ================================================================
