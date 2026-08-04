-- Drop existing insecure policies
DROP POLICY IF EXISTS "Authenticated users can delete their company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their company logos" ON storage.objects;

-- Add INSERT policy scoped to user folder
CREATE POLICY "Users can upload logos to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add UPDATE policy scoped to user folder
CREATE POLICY "Users can update logos in their folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add DELETE policy scoped to user folder
CREATE POLICY "Users can delete logos in their folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);