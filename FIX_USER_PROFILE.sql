-- Fix: Create user profile for patelpraveen972@gmail.com
-- This user exists in auth.users but not in public.users

-- First, check if user already exists (should return 0)
SELECT COUNT(*) FROM public.users WHERE email = 'patelpraveen972@gmail.com';

-- Insert the user profile
INSERT INTO public.users (name, email, avatar)
VALUES (
    'patelpraveen972',
    'patelpraveen972@gmail.com',
    'https://ui-avatars.com/api/?name=patelpraveen972&background=random'
)
ON CONFLICT (email) DO NOTHING;

-- Verify the insert
SELECT id, name, email FROM public.users WHERE email = 'patelpraveen972@gmail.com';
