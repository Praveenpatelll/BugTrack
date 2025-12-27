
-- Fix Bugs Table to use UUID for user references matches Supabase Auth and public.users
ALTER TABLE public.bugs 
  DROP CONSTRAINT IF EXISTS bugs_reporter_id_fkey,
  DROP CONSTRAINT IF EXISTS bugs_assignee_id_fkey;

ALTER TABLE public.bugs
  ALTER COLUMN reporter_id TYPE uuid USING reporter_id::text::uuid, -- careful if data exists, might need conversion logic or dropping data
  ALTER COLUMN assignee_id TYPE uuid USING assignee_id::text::uuid;

-- Re-add foreign keys to public.users (which should be UUID now)
ALTER TABLE public.bugs
  ADD CONSTRAINT bugs_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  ADD CONSTRAINT bugs_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);

-- Enable RLS if not already
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert bugs
CREATE POLICY "Users can create bugs" 
  ON public.bugs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Allow users to view all bugs
CREATE POLICY "Users can view all bugs" 
  ON public.bugs 
  FOR SELECT 
  TO authenticated, anon -- allowing anon for now to simplify debugging if needed, or remove anon
  USING (true);

-- Policy: Allow reporter to update/delete their own bugs
CREATE POLICY "Users can update own bugs" 
  ON public.bugs 
  FOR UPDATE 
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can delete own bugs" 
  ON public.bugs 
  FOR DELETE 
  USING (auth.uid() = reporter_id);
