-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200918
-- nome:   zapp_history_14_contact_stats_mat_view

-- ============================================================================
-- MELHORIA 14: Materialized view de stats agregadas por contato
-- Refresh diário pelo cron. Permite queries instantâneas no front.
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS zapp_history.contact_message_stats;

CREATE MATERIALIZED VIEW zapp_history.contact_message_stats AS
SELECT
  c.id AS contact_id,
  c.full_name,
  c.company_id,
  co.nome_crm AS company_name,

  COUNT(m.id) AS total_messages,
  COUNT(m.id) FILTER (WHERE m.direction = 'inbound') AS inbound_count,
  COUNT(m.id) FILTER (WHERE m.direction = 'outbound') AS outbound_count,

  COUNT(DISTINCT mm.id) AS total_media,
  COUNT(DISTINCT ma.id) AS total_audios,
  COUNT(DISTINCT ml.id) AS total_links,

  MIN(m.created_at) AS first_message_at,
  MAX(m.created_at) AS last_message_at,
  COUNT(DISTINCT DATE(m.created_at AT TIME ZONE 'America/Sao_Paulo')) AS active_days,

  AVG(ma.duration_seconds) AS avg_audio_duration,
  SUM(ma.duration_seconds) AS total_audio_seconds,

  COUNT(DISTINCT cds.id) AS total_summaries,
  MAX(cds.summary_date) AS last_summary_date,

  AVG(cds.sentiment_score) AS avg_sentiment_score,
  MODE() WITHIN GROUP (ORDER BY cds.sentiment_overall) AS dominant_sentiment

FROM public.contacts c
LEFT JOIN public.companies co ON co.id = c.company_id
LEFT JOIN zapp_history.messages m ON m.contact_id = c.id
LEFT JOIN zapp_history.message_media mm ON mm.contact_id = c.id
LEFT JOIN zapp_history.message_audio ma ON ma.contact_id = c.id
LEFT JOIN zapp_history.message_links ml ON ml.contact_id = c.id
LEFT JOIN zapp_history.conversation_daily_summaries cds ON cds.contact_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.full_name, c.company_id, co.nome_crm;

CREATE UNIQUE INDEX idx_cms_contact_id ON zapp_history.contact_message_stats(contact_id);
CREATE INDEX idx_cms_last_message ON zapp_history.contact_message_stats(last_message_at DESC NULLS LAST);
CREATE INDEX idx_cms_total_messages ON zapp_history.contact_message_stats(total_messages DESC);
CREATE INDEX idx_cms_company ON zapp_history.contact_message_stats(company_id);

-- Função de refresh (chamada por cron diariamente)
CREATE OR REPLACE FUNCTION zapp_history.refresh_contact_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY zapp_history.contact_message_stats;
END;
$fn$;

-- Adiciona ao cron (refresh diário às 03:00 UTC)
DO $$ BEGIN PERFORM cron.unschedule('zapp-refresh-contact-stats'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'zapp-refresh-contact-stats',
  '0 3 * * *',
  $cmd$SELECT zapp_history.refresh_contact_stats();$cmd$
);

COMMENT ON MATERIALIZED VIEW zapp_history.contact_message_stats IS
  'Estatísticas agregadas WhatsApp por contato. Refresh diário às 03h UTC.';
