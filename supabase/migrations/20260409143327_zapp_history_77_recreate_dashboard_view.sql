-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409143327
-- nome:   zapp_history_77_recreate_dashboard_view

CREATE OR REPLACE VIEW zapp_history.v_dashboard_atendimento AS
SELECT
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE) AS msgs_hoje,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND direction = 'inbound') AS msgs_recebidas_hoje,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND direction = 'outbound') AS msgs_enviadas_hoje,
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE status = 'open') AS conversas_abertas,
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE status = 'open' AND unread_count > 0) AS conversas_sem_resposta,
  (SELECT COUNT(*) FROM zapp_history.conversations WHERE last_message_at > NOW() - INTERVAL '1 hour') AS conversas_ativas_1h,
  (SELECT COUNT(*) FROM zapp_history.v_pedidos_detectados WHERE recebido_em::date = CURRENT_DATE) AS pedidos_detectados_hoje,
  (SELECT COUNT(*) FROM zapp_history.v_pedidos_detectados WHERE prioridade = 1 AND recebido_em::date = CURRENT_DATE) AS pedidos_hot_hoje,
  (SELECT COUNT(*) FROM zapp_history.v_pedidos_detectados WHERE classificacao = '🔥 HOT' AND recebido_em::date = CURRENT_DATE) AS leads_hot_hoje,
  (SELECT COUNT(*) FROM zapp_history.message_audio WHERE created_at::date = CURRENT_DATE) AS audios_hoje,
  (SELECT COUNT(*) FROM zapp_history.message_media WHERE created_at::date = CURRENT_DATE) AS midias_hoje,
  (SELECT COUNT(*) FROM public.connector_log WHERE parse_error IS NOT NULL AND created_at > NOW() - INTERVAL '1 day') AS erros_24h,
  (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_processed_at IS NULL AND nlp_request_id IS NOT NULL) AS nlp_pendente,
  (SELECT AVG(lead_score)::numeric(5,2) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND lead_score IS NOT NULL) AS media_lead_score_hoje,
  (SELECT jsonb_object_agg(nlp_sentiment, cnt) FROM (
    SELECT nlp_sentiment, COUNT(*) AS cnt
    FROM zapp_history.messages
    WHERE created_at::date = CURRENT_DATE AND nlp_sentiment IS NOT NULL
    GROUP BY nlp_sentiment
  ) s) AS sentimentos_hoje,
  (SELECT jsonb_object_agg(classificacao, cnt) FROM (
    SELECT classificacao, COUNT(*) AS cnt
    FROM zapp_history.v_pedidos_detectados
    WHERE recebido_em::date = CURRENT_DATE
    GROUP BY classificacao
  ) c) AS leads_classificacao_hoje;

GRANT SELECT ON zapp_history.v_dashboard_atendimento TO authenticated;

-- Recria também o dashboard_summary RPC que depende disso
CREATE OR REPLACE FUNCTION zapp_history.dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_dashboard JSONB;
  v_top_pedidos JSONB;
  v_alertas JSONB;
BEGIN
  SELECT to_jsonb(d.*) INTO v_dashboard FROM zapp_history.v_dashboard_atendimento d;

  SELECT jsonb_agg(p.*) INTO v_top_pedidos
  FROM (
    SELECT * FROM zapp_history.v_pedidos_detectados
    WHERE recebido_em > NOW() - INTERVAL '24 hours'
    LIMIT 10
  ) p;

  SELECT jsonb_agg(a.*) INTO v_alertas
  FROM (
    SELECT request_kind, entity_id, payload_preview, triggered_at
    FROM zapp_history.async_request_log
    WHERE status = 'urgent_pending_notification'
      AND triggered_at > NOW() - INTERVAL '24 hours'
    ORDER BY triggered_at DESC
    LIMIT 20
  ) a;

  RETURN jsonb_build_object(
    'generated_at', NOW(),
    'kpis', v_dashboard,
    'top_pedidos_24h', COALESCE(v_top_pedidos, '[]'::jsonb),
    'alertas_urgentes', COALESCE(v_alertas, '[]'::jsonb),
    'pipeline_status', zapp_history.health_check()->'overall_status'
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.dashboard_summary() TO authenticated, service_role;
