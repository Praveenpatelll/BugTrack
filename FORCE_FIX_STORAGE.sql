-- FORCE FIX: Allow PUBLIC (anonymous) uploads to screenshots
-- This removes the requirement for the user to be perfectly authenticated for uploads
-- Use this to unblock the functionality.

INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Screenshot" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Screenshot" ON storage.objects;

-- 1. Allow EVERYONE to View
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'screenshots' );

-- 2. Allow EVERYONE to Upload (Bypassing Auth Check)
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'screenshots' );

-- Verify
select * from storage.policies where table_name = 'objects';
