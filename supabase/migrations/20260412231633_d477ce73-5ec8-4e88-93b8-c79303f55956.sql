-- FIX 1: Storage policies for contact-avatars — change role from public to authenticated

-- Drop old public-role policies
DROP POLICY IF EXISTS "Users can upload contact avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update contact avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete contact avatars" ON storage.objects;

-- Recreate with authenticated role
CREATE POLICY "Users can upload contact avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contact-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update contact avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'contact-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete contact avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'contact-avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- FIX 2: Realtime policy — use exact prefix match instead of LIKE '%uid%'
DROP POLICY IF EXISTS "Users can only access their own realtime channels" ON realtime.messages;

CREATE POLICY "Users can only access their own realtime channels"
ON realtime.messages FOR ALL TO authenticated
USING (
  realtime.topic() LIKE ((auth.uid())::text || ':%')
)
WITH CHECK (
  realtime.topic() LIKE ((auth.uid())::text || ':%')
);