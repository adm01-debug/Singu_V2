-- Remove the unscoped INSERT policy that allows any authenticated user to upload anywhere
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;