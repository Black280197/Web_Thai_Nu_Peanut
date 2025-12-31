-- Add image_url field to wishes table
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for wishes images (run this in Supabase Dashboard -> Storage)
-- Bucket name: wishes-images
-- Public bucket: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- Storage policies for wishes-images bucket
-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload wish images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wishes-images');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access to wish images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wishes-images');

-- Policy 3: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own wish images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wishes-images' AND auth.uid()::text = (storage.foldername(name))[1]);
