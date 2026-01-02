-- ================================================================
-- SETUP ROLES AND PERMISSIONS
-- ================================================================

-- 1. Add 'role' column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'Developer';

-- 2. Ensure existing users have a role
UPDATE public.users 
SET role = 'Developer' 
WHERE role IS NULL;

-- 3. Create a helper function to check if user is admin (Optional, but useful for RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
