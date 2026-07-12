
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS transcription_status TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (transcription_status IN ('pending','processing','done','failed','not_applicable')),
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_company_id
  ON public.whatsapp_messages (company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_company_ts
  ON public.whatsapp_messages (user_id, company_id, "timestamp" DESC);

DROP POLICY IF EXISTS "wa audio owner read" ON storage.objects;
CREATE POLICY "wa audio owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "wa audio owner insert" ON storage.objects;
CREATE POLICY "wa audio owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "wa audio owner delete" ON storage.objects;
CREATE POLICY "wa audio owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'whatsapp-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
