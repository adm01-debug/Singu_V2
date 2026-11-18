-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409141416
-- nome:   zapp_history_62_dashboard_view

CREATE OR REPLACE VIEW zapp_history.v_dashboard_atendimento AS
SELECT
  -- Hoje
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE) AS msgs_hoje,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND direction = 'inbound') AS msgs_recebidas_hoje,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND direction = 'outbound') AS msgs_enviadas_hoje,
  -- Conversas
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE status = 'open') AS conversas_abertas,
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE status = 'open' AND unread_count > 0) AS conversas_sem_resposta,
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE last_message_at > NOW() - INTERVAL '1 hour') AS conversas_ativas_1h,
  -- Pedidos automáticos
  (SELECT COUNT(*) FROM zapp_history.v_pedidos_detectados WHERE recebido_em::date = CURRENT_DATE) AS pedidos_detectados_hoje,
  (SELECT COUNT(*) FROM zapp_history.v_pedidos_detectados WHERE prioridade = 1 AND recebido_em::date = CURRENT_DATE) AS pedidos_urgentes_hoje,
  -- Mídia
  (SELECT COUNT(*) FROM zapp_history.message_audio WHERE created_at::date = CURRENT_DATE) AS audios_hoje,
  (SELECT COUNT(*) FROM zapp_history.message_media WHERE created_at::date = CURRENT_DATE) AS midias_hoje,
  -- Saúde do pipeline
  (SELECT COUNT(*) FROM public.connector_log WHERE parse_error IS NOT NULL AND created_at > NOW() - INTERVAL '1 day') AS erros_24h,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_processed_at IS NULL AND nlp_request_id IS NOT NULL) AS nlp_pendente,
  -- Top sentimentos hoje
  (SELECT jsonb_object_agg(nlp_sentiment, cnt) FROM (
    SELECT nlp_sentiment, COUNT(*) AS cnt
    FROM zapp_history.messages
    WHERE created_at::date = CURRENT_DATE AND nlp_sentiment IS NOT NULL
    GROUP BY nlp_sentiment
  ) s) AS sentimentos_hoje;

GRANT SELECT ON zapp_history.v_dashboard_atendimento TO authenticated;
