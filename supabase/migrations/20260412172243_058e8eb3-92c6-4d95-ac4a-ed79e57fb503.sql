-- Create storage bucket for contact avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('contact-avatars', 'contact-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Contact avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Contact avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'contact-avatars');

-- Users can upload their own avatars (folder = user_id)
DROP POLICY IF EXISTS "Users can upload contact avatars" ON storage.objects;
CREATE POLICY "Users can upload contact avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contact-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatars
DROP POLICY IF EXISTS "Users can update contact avatars" ON storage.objects;
CREATE POLICY "Users can update contact avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'contact-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete contact avatars" ON storage.objects;
CREATE POLICY "Users can delete contact avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'contact-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);