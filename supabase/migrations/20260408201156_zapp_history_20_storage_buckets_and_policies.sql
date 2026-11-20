-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201156
-- nome:   zapp_history_20_storage_buckets_and_policies

-- ============================================================================
-- MELHORIA 20: Cria buckets whatsapp-media e audio-messages + RLS policies
-- ============================================================================

-- Buckets privados com limites de tamanho
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('whatsapp-media', 'whatsapp-media', false, 52428800,  -- 50 MB
   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic',
         'video/mp4','video/webm','video/quicktime','video/x-msvideo',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain','text/csv',
         'application/zip','application/x-rar-compressed']),
  ('audio-messages', 'audio-messages', false, 26214400,  -- 25 MB
   ARRAY['audio/ogg','audio/opus','audio/mpeg','audio/mp3','audio/mp4',
         'audio/m4a','audio/wav','audio/x-wav','audio/aac','audio/webm'])
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Policies whatsapp-media
-- Path pattern: contacts/{contact_id}/{YYYY}/{MM}/{type}/{filename}
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "wm_service_all" ON storage.objects;
CREATE POLICY "wm_service_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'whatsapp-media' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'whatsapp-media' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "wm_authenticated_read" ON storage.objects;
CREATE POLICY "wm_authenticated_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'whatsapp-media'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()
      )
      OR (
        (storage.foldername(name))[1] = 'contacts'
        AND zapp_history.user_can_access_contact(
          ((storage.foldername(name))[2])::uuid,
          auth.uid()
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- Policies audio-messages (mesma estrutura)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "am_service_all" ON storage.objects;
CREATE POLICY "am_service_all" ON storage.objects
  FOR ALL
  USING (bucket_id = 'audio-messages' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'audio-messages' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "am_authenticated_read" ON storage.objects;
CREATE POLICY "am_authenticated_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-messages'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()
      )
      OR (
        (storage.foldername(name))[1] = 'contacts'
        AND zapp_history.user_can_access_contact(
          ((storage.foldername(name))[2])::uuid,
          auth.uid()
        )
      )
    )
  );
