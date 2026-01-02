-- ================================================================
-- ENABLE DELETE POLICIES FOR BUGS AND PROJECTS
-- ================================================================
-- This script enables deletion of bugs and projects by authorized users.
-- ================================================================

-- 1. Enable Delete Policy for BUGS
-- Allow users to delete bugs (Subject to application logic, e.g., owners/admins)
-- For simplicity, we allow authenticated users to delete, and let the UI handle the "can delete" check
-- or a more specific policy:
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.bugs;
CREATE POLICY "Enable delete for authenticated users"
ON public.bugs
FOR DELETE
USING (auth.role() = 'authenticated');

-- 2. Enable Delete Policy for PROJECTS
-- Allow admins to delete projects
DROP POLICY IF EXISTS "Enable delete for projects" ON public.projects;
CREATE POLICY "Enable delete for projects"
ON public.projects
FOR DELETE
USING (auth.role() = 'authenticated'); -- Access control handled by app logic or further restrictions

-- 3. Ensure Cascade Delete
-- When a project is deleted, delete all its bugs automatically.
-- Note: This requires the foreign key to be set up with ON DELETE CASCADE.
-- We will try to alter the constraint if it exists.

DO $$
BEGIN
    -- Try to drop the existing FK if it doesn't have cascade
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bugs_project_id_fkey') THEN
        ALTER TABLE public.bugs DROP CONSTRAINT bugs_project_id_fkey;
    END IF;
    
    -- Re-add with CASCADE
    ALTER TABLE public.bugs
    ADD CONSTRAINT bugs_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not alter foreign key constraint: %', SQLERRM;
END $$;
