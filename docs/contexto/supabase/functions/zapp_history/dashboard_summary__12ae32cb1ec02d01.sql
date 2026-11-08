CREATE OR REPLACE FUNCTION zapp_history.dashboard_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
