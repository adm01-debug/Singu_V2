-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409141452
-- nome:   zapp_history_64_dashboard_summary_rpc

CREATE OR REPLACE FUNCTION zapp_history.dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
