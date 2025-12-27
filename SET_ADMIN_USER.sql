-- Make a specific user an Admin to test role-based access control
-- Replace the email with your actual admin user's email

-- Option 1: Set Admin by email (recommended)
UPDATE public.users 
SET role = 'Admin' 
WHERE email = 'patelpraveen972@gmail.com';

-- Option 2: Set Admin by name
-- UPDATE public.users 
-- SET role = 'Admin' 
-- WHERE name = 'Praveen patel';

-- Option 3: Set the first user as Admin
-- UPDATE public.users 
-- SET role = 'Admin' 
-- WHERE id = (SELECT id FROM public.users ORDER BY id LIMIT 1);

-- Verify the change
SELECT id, name, email, role FROM public.users ORDER BY id;
