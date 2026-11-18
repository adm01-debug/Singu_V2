-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408195951
-- nome:   zapp_history_03_message_media

CREATE TABLE IF NOT EXISTS zapp_history.message_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  message_id UUID NOT NULL REFERENCES zapp_history.messages(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL,

  media_type TEXT NOT NULL CHECK (media_type IN ('image','video','document','sticker')),

  storage_bucket TEXT NOT NULL DEFAULT 'whatsapp-media',
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  file_extension TEXT,
  hash_sha256 TEXT,

  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,

  caption TEXT,
  alt_text TEXT,
  detected_objects JSONB,
  ocr_text TEXT,

  whatsapp_media_id TEXT,
  evolution_message_id TEXT,

  download_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (download_status IN ('pending','downloading','downloaded','failed','expired')),
  download_attempts INTEGER NOT NULL DEFAULT 0,
  download_error TEXT,
  downloaded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mm_message ON zapp_history.message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_mm_contact_created
  ON zapp_history.message_media(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mm_type
  ON zapp_history.message_media(media_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mm_pending_download
  ON zapp_history.message_media(created_at)
  WHERE download_status IN ('pending','failed') AND download_attempts < 5;
CREATE INDEX IF NOT EXISTS idx_mm_hash
  ON zapp_history.message_media(hash_sha256)
  WHERE hash_sha256 IS NOT NULL;

DROP TRIGGER IF EXISTS trg_mm_updated_at ON zapp_history.message_media;
CREATE TRIGGER trg_mm_updated_at
  BEFORE UPDATE ON zapp_history.message_media
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();
