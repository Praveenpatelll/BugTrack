-- ================================================================
-- SETUP DYNAMIC PERMISSIONS
-- ================================================================

-- 1. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    role text PRIMARY KEY,
    can_delete_project boolean DEFAULT false,
    can_delete_bug boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    can_manage_permissions boolean DEFAULT false
);

-- 2. Seed default permissions
INSERT INTO public.permissions (role, can_delete_project, can_delete_bug, can_manage_users, can_manage_permissions)
VALUES 
    ('Admin', true, true, true, true),
    ('Manager', false, true, true, false),
    ('Developer', false, false, false, false),
    ('Reporter', false, false, false, false),
    ('Guest', false, false, false, false)
ON CONFLICT (role) DO UPDATE SET
    can_delete_project = EXCLUDED.can_delete_project,
    can_delete_bug = EXCLUDED.can_delete_bug,
    can_manage_users = EXCLUDED.can_manage_users,
    can_manage_permissions = EXCLUDED.can_manage_permissions;

-- 3. Enable RLS (Read-only for everyone, Write for Admins)
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all authenticated users"
ON public.permissions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access for Admins"
ON public.permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  )
);
