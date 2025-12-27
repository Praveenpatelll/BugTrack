
-- Add a 'role' column to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'Developer';

-- Verify it
SELECT * FROM public.users LIMIT 5;
