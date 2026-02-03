-- Create table to track status changes
CREATE TABLE IF NOT EXISTS public.bug_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bug_id BIGINT REFERENCES public.bugs(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.users(id),
    old_status TEXT,
    new_status TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bug_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert history
CREATE POLICY "Enable insert for authenticated users" ON public.bug_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view history
CREATE POLICY "Enable select for authenticated users" ON public.bug_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.bug_history TO authenticated;
GRANT ALL ON public.bug_history TO service_role;
