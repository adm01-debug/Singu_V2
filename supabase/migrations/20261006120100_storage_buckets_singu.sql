-- Buckets de Storage consumidos pelo frontend do Singu e ausentes no projeto
-- canônico (pgxfvjmuubtbowutlide): `documents` (useDocuments, useDealRooms)
-- e `whatsapp-audio` (useWhatsAppImport). Ambos privados; escrita e leitura
-- restritas ao dono da pasta (`{auth.uid()}/...`) ou ao dono da deal room
-- (`deal-rooms/{room_id}/...`). Idempotente.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false),
       ('whatsapp-audio', 'whatsapp-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload own docs" ON storage.objects;
CREATE POLICY "Users upload own docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users read own docs" ON storage.objects;
CREATE POLICY "Users read own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users delete own docs" ON storage.objects;
CREATE POLICY "Users delete own docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "deal_rooms_owner_read_docs" ON storage.objects;
CREATE POLICY "deal_rooms_owner_read_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'deal-rooms'
    AND EXISTS (
      SELECT 1 FROM public.deal_rooms r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "deal_rooms_owner_write_docs" ON storage.objects;
CREATE POLICY "deal_rooms_owner_write_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'deal-rooms'
    AND EXISTS (
      SELECT 1 FROM public.deal_rooms r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "deal_rooms_owner_delete_docs" ON storage.objects;
CREATE POLICY "deal_rooms_owner_delete_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'deal-rooms'
    AND EXISTS (
      SELECT 1 FROM public.deal_rooms r
      WHERE r.id::text = (storage.foldername(name))[2]
        AND r.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "wa audio owner read" ON storage.objects;
CREATE POLICY "wa audio owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "wa audio owner insert" ON storage.objects;
CREATE POLICY "wa audio owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "wa audio owner delete" ON storage.objects;
CREATE POLICY "wa audio owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
