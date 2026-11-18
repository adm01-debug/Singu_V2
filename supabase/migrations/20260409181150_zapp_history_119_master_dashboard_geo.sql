-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409181150
-- nome:   zapp_history_119_master_dashboard_geo

CREATE OR REPLACE FUNCTION zapp_history.master_dashboard()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'pipeline_status', zapp_history.health_check()->'overall_status',
    'kpis_hoje', (SELECT to_jsonb(d.*) FROM zapp_history.v_dashboard_atendimento d),
    'fila_prioridade', (SELECT COALESCE(jsonb_agg(q.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.get_priority_queue(10)) q),
    'top_leads_24h', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'message_id', message_id, 'contato', contato, 'empresa', empresa,
        'produto', produto, 'quantidade', quantidade, 'budget', budget,
        'classificacao', classificacao, 'lead_score', lead_score,
        'etapa_funil', etapa_funil, 'acao_recomendada', acao_recomendada,
        'recebido_em', recebido_em
      )), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t
    ),
    'funil_vendas', (SELECT COALESCE(jsonb_agg(f.*), '[]'::jsonb) FROM zapp_history.v_funil_vendas f),
    'funil_origem', (SELECT COALESCE(jsonb_agg(fo.*), '[]'::jsonb) FROM zapp_history.v_funil_origem fo),
    'top_produtos', (SELECT COALESCE(jsonb_agg(tp.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp),
    'top_objecoes', (SELECT COALESCE(jsonb_agg(o.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o),
    'sla', (SELECT COALESCE(jsonb_agg(s.*), '[]'::jsonb) FROM zapp_history.v_sla_atendimento s),
    'top_contatos_valor', (SELECT COALESCE(jsonb_agg(tc.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc),
    -- NOVO: distribuição geográfica
    'demanda_geografica', (SELECT COALESCE(jsonb_agg(g.*), '[]'::jsonb) FROM zapp_history.v_demanda_geografica g),
    'top_cidades', (SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c),
    'alertas_urgentes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'entity_id', entity_id, 'request_kind', request_kind,
        'payload_preview', payload_preview, 'triggered_at', triggered_at
      )), '[]'::jsonb)
      FROM zapp_history.async_request_log
      WHERE status = 'urgent_pending_notification' AND triggered_at > NOW() - INTERVAL '24 hours'
      LIMIT 20
    )
  ) INTO v_result;
  RETURN v_result;
END;
$fn$;
