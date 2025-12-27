-- ================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR USER ROLE MANAGEMENT
-- ================================================================
-- This script adds database-level security to prevent unauthorized 
-- role updates on the users table.
--
-- Executed: December 26, 2025
-- Status: ✅ SUCCESSFULLY APPLIED
-- ================================================================

-- Step 1: Enable Row-Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policy - Only Admins can update user roles
CREATE POLICY "Only admins can update user roles"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'Admin'
  )
);

-- Step 3: Create policy - Allow all users to view profiles
CREATE POLICY "Anyone can view user profiles"
ON public.users
FOR SELECT
USING (true);

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- Run this to see all policies on the users table:

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'users';

-- ================================================================
-- EXPECTED RESULTS:
-- ================================================================
-- You should see two policies:
-- 1. "Only admins can update user roles" - FOR UPDATE
-- 2. "Anyone can view user profiles" - FOR SELECT
--
-- ================================================================
-- SECURITY BENEFITS:
-- ================================================================
-- ✅ Frontend validation (React checks role before showing UI)
-- ✅ Backend validation (Supabase checks role before UPDATE)
-- ✅ Double layer of protection
-- ✅ Prevents database manipulation via API/direct access
-- ✅ Admins can still update any user's role
-- ✅ All users can read team member profiles
--
-- ================================================================
-- TESTING:
-- ================================================================
-- Test 1: Admin user should be able to update roles ✅
-- Test 2: Developer user should NOT be able to update roles ✅
-- Test 3: All users should be able to SELECT from users table ✅
--
-- ================================================================

-- ================================================================
-- ADDITIONAL POLICIES (Optional - Uncomment if needed)
-- ================================================================

-- Allow users to update their own profile (except role)
-- CREATE POLICY "Users can update own profile"
-- ON public.users
-- FOR UPDATE
-- USING (email = auth.jwt() ->> 'email')
-- WITH CHECK (
--   (email = auth.jwt() ->> 'email') 
--   AND role = (SELECT role FROM public.users WHERE email = auth.jwt() ->> 'email')
-- );

-- Allow INSERT only for authenticated users (for signup)
-- CREATE POLICY "Authenticated users can create profile"
-- ON public.users
-- FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');

-- ================================================================
-- TROUBLESHOOTING:
-- ================================================================
-- If you need to drop policies:
-- DROP POLICY "Only admins can update user roles" ON public.users;
-- DROP POLICY "Anyone can view user profiles" ON public.users;
--
-- If you need to disable RLS:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
--
-- ================================================================
