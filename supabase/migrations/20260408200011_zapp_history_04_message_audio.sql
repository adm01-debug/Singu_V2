-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200011
-- nome:   zapp_history_04_message_audio

CREATE TABLE IF NOT EXISTS zapp_history.message_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  message_id UUID NOT NULL UNIQUE REFERENCES zapp_history.messages(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL,

  storage_bucket TEXT NOT NULL DEFAULT 'audio-messages',
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  duration_seconds NUMERIC(8,2),
  hash_sha256 TEXT,

  speaker TEXT NOT NULL DEFAULT 'contact'
    CHECK (speaker IN ('contact','agent','system')),
  agent_id UUID,

  transcription TEXT,
  transcription_language TEXT DEFAULT 'pt-BR',
  transcription_confidence NUMERIC(4,3),
  transcription_provider TEXT
    CHECK (transcription_provider IN ('whisper','elevenlabs','manual')),
  transcription_model TEXT,
  transcription_word_timestamps JSONB,
  transcription_at TIMESTAMPTZ,
  transcription_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (transcription_status IN ('pending','processing','done','failed','skipped')),
  transcription_error TEXT,
  transcription_attempts INTEGER NOT NULL DEFAULT 0,

  detected_intent TEXT,
  detected_entities JSONB,
  sentiment_score NUMERIC(3,2),
  emotion TEXT,
  speaker_pace TEXT,
  silence_ratio NUMERIC(3,2),

  embedding VECTOR(1536),
  embedding_model TEXT,
  embedding_at TIMESTAMPTZ,

  is_training_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  training_quality_score INTEGER CHECK (training_quality_score BETWEEN 1 AND 5),
  training_excluded_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_contact_created
  ON zapp_history.message_audio(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ma_pending_transcription
  ON zapp_history.message_audio(created_at)
  WHERE transcription_status IN ('pending','failed') AND transcription_attempts < 5;
CREATE INDEX IF NOT EXISTS idx_ma_speaker
  ON zapp_history.message_audio(speaker, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ma_training_eligible
  ON zapp_history.message_audio(is_training_eligible, training_quality_score DESC NULLS LAST)
  WHERE is_training_eligible = TRUE AND transcription_status = 'done';
CREATE INDEX IF NOT EXISTS idx_ma_transcription_fts
  ON zapp_history.message_audio USING GIN (to_tsvector('portuguese', coalesce(transcription, '')));
CREATE INDEX IF NOT EXISTS idx_ma_embedding
  ON zapp_history.message_audio USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

DROP TRIGGER IF EXISTS trg_ma_updated_at ON zapp_history.message_audio;
CREATE TRIGGER trg_ma_updated_at
  BEFORE UPDATE ON zapp_history.message_audio
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();
