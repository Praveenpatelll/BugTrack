
-- DELETE USER so you can Sign Up again fresh
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Delete from public profile (to remove foreign key references first)
DELETE FROM public.users 
WHERE email = 'patelpraveen972@gmail.com';

-- 2. Delete from authentication system
DELETE FROM auth.users 
WHERE email = 'patelpraveen972@gmail.com';

-- 3. Verify it's gone
SELECT * FROM auth.users WHERE email = 'patelpraveen972@gmail.com';
