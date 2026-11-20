-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174932
-- nome:   zapp_history_110_master_dashboard

-- RPC master que retorna TUDO que o front precisa em uma única chamada
CREATE OR REPLACE FUNCTION zapp_history.master_dashboard()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'pipeline_status', zapp_history.health_check()->'overall_status',

    -- KPIs do dia
    'kpis_hoje', (SELECT to_jsonb(d.*) FROM zapp_history.v_dashboard_atendimento d),

    -- Fila de prioridade (top 10 conversas aguardando)
    'fila_prioridade', (
      SELECT COALESCE(jsonb_agg(q.*), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.get_priority_queue(10)) q
    ),

    -- Top 10 leads HOT das últimas 24h
    'top_leads_24h', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'message_id', message_id,
        'contato', contato,
        'empresa', empresa,
        'produto', produto,
        'quantidade', quantidade,
        'budget', budget,
        'classificacao', classificacao,
        'lead_score', lead_score,
        'etapa_funil', etapa_funil,
        'acao_recomendada', acao_recomendada,
        'recebido_em', recebido_em
      )), '[]'::jsonb)
      FROM (
        SELECT * FROM zapp_history.v_intelligence_360
        WHERE recebido_em > NOW() - INTERVAL '24 hours'
        LIMIT 10
      ) t
    ),

    -- Funil de vendas
    'funil_vendas', (
      SELECT COALESCE(jsonb_agg(f.*), '[]'::jsonb)
      FROM zapp_history.v_funil_vendas f
    ),

    -- Funil por canal de origem
    'funil_origem', (
      SELECT COALESCE(jsonb_agg(fo.*), '[]'::jsonb)
      FROM zapp_history.v_funil_origem fo
    ),

    -- Top 5 produtos em demanda
    'top_produtos', (
      SELECT COALESCE(jsonb_agg(tp.*), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp
    ),

    -- Top 5 objeções recorrentes
    'top_objecoes', (
      SELECT COALESCE(jsonb_agg(o.*), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o
    ),

    -- SLA de atendimento
    'sla', (
      SELECT COALESCE(jsonb_agg(s.*), '[]'::jsonb)
      FROM zapp_history.v_sla_atendimento s
    ),

    -- Top 5 contatos de maior potencial
    'top_contatos_valor', (
      SELECT COALESCE(jsonb_agg(tc.*), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc
    ),

    -- Alertas urgentes pendentes
    'alertas_urgentes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'entity_id', entity_id,
        'request_kind', request_kind,
        'payload_preview', payload_preview,
        'triggered_at', triggered_at
      )), '[]'::jsonb)
      FROM zapp_history.async_request_log
      WHERE status = 'urgent_pending_notification'
        AND triggered_at > NOW() - INTERVAL '24 hours'
      LIMIT 20
    )
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.master_dashboard() TO authenticated, service_role;

COMMENT ON FUNCTION zapp_history.master_dashboard() IS
'RPC master: retorna TODO o estado do pipeline em uma única chamada. Use no front-end na home do dashboard.';
