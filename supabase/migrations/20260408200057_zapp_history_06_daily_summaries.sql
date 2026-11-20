-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200057
-- nome:   zapp_history_06_daily_summaries

CREATE TABLE IF NOT EXISTS zapp_history.conversation_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL,

  summary_date DATE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',

  message_count INTEGER NOT NULL DEFAULT 0,
  inbound_count INTEGER NOT NULL DEFAULT 0,
  outbound_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  audio_count INTEGER NOT NULL DEFAULT 0,
  link_count INTEGER NOT NULL DEFAULT 0,
  total_chars BIGINT,
  total_audio_seconds NUMERIC(10,2),

  -- Conteúdo gerado por IA
  summary_text TEXT,
  summary_short TEXT,
  key_points TEXT[],
  topics TEXT[],
  intents TEXT[],
  entities JSONB,
  next_steps TEXT[],
  open_questions TEXT[],
  agent_actions TEXT[],
  customer_mood TEXT,
  customer_pain_points TEXT[],

  sentiment_overall TEXT
    CHECK (sentiment_overall IN ('positive','neutral','negative','mixed')),
  sentiment_score NUMERIC(3,2),

  avg_response_time_seconds INTEGER,
  max_response_time_seconds INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  has_escalation BOOLEAN DEFAULT FALSE,
  conversion_signal TEXT,

  -- Campos SINGU (para alimentar DISC, EQ, vieses, hidden objections)
  singu_signals JSONB,  -- {disc_hints, eq_hints, bias_hints, objections_hints}

  generated_by_model TEXT,
  generated_at TIMESTAMPTZ,
  generation_cost_cents NUMERIC(8,4),
  embedding VECTOR(1536),

  -- Link com public.interactions (SINGU)
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  synced_to_interactions BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_contact_day UNIQUE (contact_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_cds_contact_date
  ON zapp_history.conversation_daily_summaries(contact_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_cds_date
  ON zapp_history.conversation_daily_summaries(summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_cds_pending_sync
  ON zapp_history.conversation_daily_summaries(created_at)
  WHERE synced_to_interactions = FALSE;
CREATE INDEX IF NOT EXISTS idx_cds_sentiment
  ON zapp_history.conversation_daily_summaries(sentiment_overall, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_cds_high_intent
  ON zapp_history.conversation_daily_summaries(summary_date DESC)
  WHERE conversion_signal IN ('high_intent','ready_to_buy');
CREATE INDEX IF NOT EXISTS idx_cds_embedding
  ON zapp_history.conversation_daily_summaries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

DROP TRIGGER IF EXISTS trg_cds_updated_at ON zapp_history.conversation_daily_summaries;
CREATE TRIGGER trg_cds_updated_at
  BEFORE UPDATE ON zapp_history.conversation_daily_summaries
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

COMMENT ON TABLE zapp_history.conversation_daily_summaries IS
  'Sumário diário (24h, dia civil BRT) por contato. Idempotente via UNIQUE(contact_id, summary_date). Sync com public.interactions para alimentar SINGU.';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.singu_signals IS
  'Sinais extraídos para os módulos SINGU: dicas DISC, EQ, vieses cognitivos, objeções ocultas. Input para enriquecimento assíncrono.';
