-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200248
-- nome:   zapp_history_09_observability

-- ============================================================================
-- ai_cost_log: rastreamento de custo OpenAI por operação
-- ============================================================================
CREATE TABLE IF NOT EXISTS zapp_history.ai_cost_log (
  id BIGSERIAL PRIMARY KEY,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  function_name TEXT NOT NULL,              -- generate-daily-summary, embed-message, etc
  operation TEXT NOT NULL,                  -- summary, embedding, transcription
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL,

  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  duration_seconds NUMERIC(8,2),
  cost_cents NUMERIC(10,4),                 -- centavos de dólar

  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  reference_id UUID,                         -- id da entidade relacionada (summary_id, message_id)
  reference_type TEXT,

  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_acl_occurred
  ON zapp_history.ai_cost_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_acl_function_date
  ON zapp_history.ai_cost_log(function_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_acl_reference
  ON zapp_history.ai_cost_log(reference_type, reference_id);

ALTER TABLE zapp_history.ai_cost_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY acl_admin_read ON zapp_history.ai_cost_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );
CREATE POLICY acl_service_all ON zapp_history.ai_cost_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Views de observabilidade
-- ============================================================================

-- Dashboard de custo diário por função
CREATE OR REPLACE VIEW zapp_history.v_daily_cost AS
SELECT
  date_trunc('day', occurred_at)::date AS day,
  function_name,
  model,
  COUNT(*) AS calls,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful,
  COUNT(*) FILTER (WHERE success = FALSE) AS failed,
  SUM(input_tokens) AS input_tokens_total,
  SUM(output_tokens) AS output_tokens_total,
  SUM(cost_cents) / 100.0 AS cost_usd,
  AVG(duration_seconds) AS avg_duration_s
FROM zapp_history.ai_cost_log
WHERE occurred_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, cost_usd DESC;

-- Pendências por pipeline (tempo real)
CREATE OR REPLACE VIEW zapp_history.v_pipeline_pending AS
SELECT 'media_download' AS pipeline,
       COUNT(*) AS pending,
       COUNT(*) FILTER (WHERE download_attempts >= 3) AS stuck
FROM zapp_history.message_media
WHERE download_status IN ('pending','failed') AND download_attempts < 5
UNION ALL
SELECT 'audio_transcription',
       COUNT(*),
       COUNT(*) FILTER (WHERE transcription_attempts >= 3)
FROM zapp_history.message_audio
WHERE transcription_status IN ('pending','failed') AND transcription_attempts < 5
UNION ALL
SELECT 'link_metadata',
       COUNT(*),
       COUNT(*) FILTER (WHERE fetch_attempts >= 2)
FROM zapp_history.message_links
WHERE fetch_status IN ('pending','failed') AND fetch_attempts < 3
UNION ALL
SELECT 'message_embedding',
       COUNT(*),
       0
FROM zapp_history.messages
WHERE embedding_status = 'pending'
UNION ALL
SELECT 'summary_sync',
       COUNT(*),
       0
FROM zapp_history.conversation_daily_summaries
WHERE synced_to_interactions = FALSE;

-- Sumários de hoje e ontem (mais acessada do front)
CREATE OR REPLACE VIEW zapp_history.v_recent_summaries AS
SELECT
  s.id,
  s.contact_id,
  c.full_name AS contact_name,
  co.nome_crm AS company_name,
  s.summary_date,
  s.message_count,
  s.audio_count,
  s.media_count,
  s.summary_short,
  s.sentiment_overall,
  s.sentiment_score,
  s.conversion_signal,
  s.customer_mood,
  s.synced_to_interactions,
  s.generated_by_model,
  s.generation_cost_cents,
  s.created_at
FROM zapp_history.conversation_daily_summaries s
JOIN public.contacts c ON c.id = s.contact_id
LEFT JOIN public.companies co ON co.id = s.company_id
WHERE s.summary_date >= CURRENT_DATE - 7
ORDER BY s.summary_date DESC, s.message_count DESC;
