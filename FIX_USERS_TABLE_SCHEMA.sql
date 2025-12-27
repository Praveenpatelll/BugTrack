-- FIX USERS TABLE SCHEMA
-- This script fixes the users table to properly integrate with Supabase Auth
-- IMPORTANT: Run this script in your Supabase SQL Editor

-- Step 1: Drop the existing users table and recreate it with correct schema
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create users table with UUID as primary key (matching auth.users)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    avatar text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Step 3: Enable RLS (Row Level Security) for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies to allow users to read all profiles but only update their own
CREATE POLICY "Users can view all profiles"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 5: Re-insert existing users if you had any
-- Adjust these values based on your existing users
INSERT INTO public.users (id, name, email, avatar)
VALUES 
    -- Add your existing authenticated users here with their actual auth UUIDs
    -- You can find these UUIDs in Authentication > Users in Supabase dashboard
    -- Example (replace with actual UUID from auth.users):
    -- ('22b72888-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'patelpraveen972', 'patelpraveen972@gmail.com', 'https://ui-avatars.com/api/?name=patelpraveen972&background=random')
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 7: Check if there are any foreign key relationships that need to be recreated
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'users' OR ccu.table_name = 'users');
