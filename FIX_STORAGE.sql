-- Ensure screenshots bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove conflicting policies if any (to reset state)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;

-- Policy 1: Everyone can view screenshots (Public Read)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'screenshots' );

-- Policy 2: Authenticated users can upload screenshots
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'screenshots' );

-- Verify the buckets
select * from storage.buckets;
