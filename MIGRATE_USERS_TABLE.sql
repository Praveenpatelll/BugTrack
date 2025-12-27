-- MIGRATE EXISTING USERS TO NEW SCHEMA
-- This script recreates the users table with proper UUID support
-- and migrates existing authenticated users

-- Step 1: Backup existing data (if needed)
-- CREATE TABLE users_backup AS SELECT * FROM public.users;

-- Step 2: Drop existing users table and recreate with correct schema
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    avatar text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Step 3: Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
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

-- Step 5: Insert existing authenticated users
-- Based on the actual authenticated users from your Supabase dashboard
INSERT INTO public.users (id, name, email, avatar) VALUES
    (
        '22b72888-5793-4c90-9547-70dbfeb3de68',
        'john.doe',
        'john.doe@example.com',
        'https://ui-avatars.com/api/?name=john.doe&background=random'
    ),
    (
        '5f4c4d8f-bc8f-44c5-9069-8e787b5ecc29',
        'patelpraveen972',
        'patelpraveen972@gmail.com',
        'https://ui-avatars.com/api/?name=patelpraveen972&background=random'
    ),
    (
        'ed4d3002-b214-4aea-bb67-e975d58ac4f6',
        'testuser',
        'testuser@example.com',
        'https://ui-avatars.com/api/?name=testuser&background=random'
    )
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify the migration
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at;

-- Step 7: Check table schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
