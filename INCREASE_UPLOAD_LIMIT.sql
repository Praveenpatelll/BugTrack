-- Increase the file size limit for the 'attachments' bucket
-- Default is often restricted. Setting to 1GB (1073741824 bytes) or NULL (unlimited check)

UPDATE storage.buckets
SET file_size_limit = 1073741824, -- 1 GB
    allowed_mime_types = null     -- Allow all file types
WHERE id = 'attachments';

-- Verify the change
SELECT id, name, file_size_limit, allowed_mime_types, public 
FROM storage.buckets 
WHERE id = 'attachments';
