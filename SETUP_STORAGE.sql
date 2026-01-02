-- Enable Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for Avatars: Public Read, Auth Upload/Update
CREATE POLICY "Avatar Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Avatar Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Avatar Auth Update"
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Avatar Auth Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Policy for Attachments: Public Read, Auth Upload (just in case)
CREATE POLICY "Attachment Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'attachments' );

CREATE POLICY "Attachment Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );

CREATE POLICY "Attachment Auth Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );
