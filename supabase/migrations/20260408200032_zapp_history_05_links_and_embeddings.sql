-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200032
-- nome:   zapp_history_05_links_and_embeddings

-- ----------------------------------------------------------------------------
-- message_links
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zapp_history.message_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES zapp_history.messages(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  url_normalized TEXT,
  url_hash TEXT,
  domain TEXT,
  scheme TEXT,
  path TEXT,

  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  og_type TEXT,
  og_metadata JSONB,

  fetch_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (fetch_status IN ('pending','fetching','done','failed','skipped','blocked')),
  fetch_attempts INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ,
  fetch_error TEXT,

  is_safe BOOLEAN,
  safety_check_at TIMESTAMPTZ,
  is_shortened BOOLEAN DEFAULT FALSE,
  resolved_url TEXT,

  link_category TEXT,
  is_internal BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_message ON zapp_history.message_links(message_id);
CREATE INDEX IF NOT EXISTS idx_ml_contact
  ON zapp_history.message_links(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_domain ON zapp_history.message_links(domain);
CREATE INDEX IF NOT EXISTS idx_ml_url_hash ON zapp_history.message_links(url_hash);
CREATE INDEX IF NOT EXISTS idx_ml_pending
  ON zapp_history.message_links(created_at)
  WHERE fetch_status IN ('pending','failed') AND fetch_attempts < 3;

DROP TRIGGER IF EXISTS trg_ml_updated_at ON zapp_history.message_links;
CREATE TRIGGER trg_ml_updated_at
  BEFORE UPDATE ON zapp_history.message_links
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- message_embeddings (pgvector 1536 para RAG)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zapp_history.message_embeddings (
  message_id UUID PRIMARY KEY REFERENCES zapp_history.messages(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'message'
    CHECK (content_type IN ('message','audio_transcription','caption','ocr')),

  embedding VECTOR(1536) NOT NULL,
  model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  dimensions INTEGER NOT NULL DEFAULT 1536,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_me_contact
  ON zapp_history.message_embeddings(contact_id);
CREATE INDEX IF NOT EXISTS idx_me_vector
  ON zapp_history.message_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
